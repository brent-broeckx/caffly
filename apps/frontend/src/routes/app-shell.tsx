import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildChatWebSocketUrl,
  fetchRoomMessages,
  fetchSidebarData,
  sendRoomMessage
} from "../chat/api.js";
import type { ChatMessage, ChatWsIncoming, SidebarProject, SidebarRoom } from "../chat/types.js";
import { resolveApiBaseUrl } from "../auth/url.js";
import { TeamChatPanel } from "./chat/team-chat-panel.js";
import { OverviewDashboard } from "./overview/overview-dashboard.js";

type NavSection = "Overview" | "Pull Requests" | "CI / CD" | "Snippets" | "Team Chat";

const navItems: NavSection[] = ["Overview", "Pull Requests", "CI / CD", "Snippets", "Team Chat"];

function appendUniqueMessage(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (messages.some((message) => message.id === incoming.id)) {
    return messages;
  }

  return [...messages, incoming];
}

function findSelectedRoomName(projects: SidebarProject[], roomId: string | null): string {
  if (!roomId) {
    return "No room selected";
  }

  for (const project of projects) {
    const room = project.rooms.find((candidate) => candidate.id === roomId);

    if (room) {
      return `${project.name} / ${room.name}`;
    }
  }

  return "Unknown room";
}

function buildRoomChannels(room: SidebarRoom): string[] {
  const normalizedName = room.name.toLowerCase();

  if (normalizedName.includes("general")) {
    return ["chat", "announcements", "resources"];
  }

  if (normalizedName.includes("sync")) {
    return ["chat", "standup", "notes"];
  }

  return ["chat", "threads", "updates"];
}

export function AppShellPage() {
  const [activeSection, setActiveSection] = useState<NavSection>("Overview");
  const [projects, setProjects] = useState<SidebarProject[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sidebarError, setSidebarError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(new Set());

  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);
  const selectedRoomIdRef = useRef<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    let isMounted = true;

    void fetchSidebarData(apiBaseUrl)
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setProjects(payload.projects);
        setSelectedRoomId((current) => {
          if (current) {
            return current;
          }

          const firstRoom = payload.projects.flatMap((project) => project.rooms)[0];

          selectedRoomIdRef.current = firstRoom?.id ?? null;

          return firstRoom?.id ?? null;
        });

        const firstProject = payload.projects[0];
        const firstRoom = firstProject?.rooms[0];

        if (firstProject) {
          setExpandedProjectIds(new Set([firstProject.id]));
        }

        if (firstRoom) {
          setExpandedRoomIds(new Set([firstRoom.id]));
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setSidebarError(error instanceof Error ? error.message : "Unable to load projects");
      });

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    let isMounted = true;

    function subscribeToRoom(roomId: string | null | undefined): void {
      if (!roomId) {
        return;
      }

      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      socket.send(
        JSON.stringify({
          type: "subscribe",
          roomId
        })
      );
    }

    function clearReconnectTimer(): void {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    function connectSocket(): void {
      const socket = new WebSocket(buildChatWebSocketUrl(apiBaseUrl));
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) {
          socket.close();

          return;
        }

        setChatError(null);
        clearReconnectTimer();
        subscribeToRoom(selectedRoomIdRef.current);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as ChatWsIncoming;

          if (payload.type === "message:new") {
            if (selectedRoomIdRef.current === payload.message.roomId) {
              setMessages((current) => appendUniqueMessage(current, payload.message));
            }

            return;
          }

          if (payload.type === "connected") {
            subscribeToRoom(selectedRoomIdRef.current);

            return;
          }

          if (payload.type === "subscribed") {
            setChatError(null);

            return;
          }

          if (payload.type === "error") {
            setChatError(payload.message);
          }
        } catch {
          setChatError("Received malformed realtime payload");
        }
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!isMounted) {
          return;
        }

        if (reconnectTimeoutRef.current === null) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectSocket();
          }, 1500);
        }
      };

      socket.onerror = () => {
        setChatError("Realtime connection lost. Reconnecting...");
      };
    }

    connectSocket();

    return () => {
      isMounted = false;
      clearReconnectTimer();
      const socket = socketRef.current;

      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }

      socketRef.current = null;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      selectedRoomIdRef.current = null;

      return;
    }

    selectedRoomIdRef.current = selectedRoomId;

    let isMounted = true;
    setIsLoadingMessages(true);

    void fetchRoomMessages(apiBaseUrl, selectedRoomId)
      .then((roomMessages) => {
        if (!isMounted) {
          return;
        }

        setMessages(roomMessages);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setChatError(error instanceof Error ? error.message : "Unable to load messages");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      });

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "subscribe",
          roomId: selectedRoomId
        })
      );
    }

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, selectedRoomId]);

  async function handleSendMessage(): Promise<void> {
    if (!selectedRoomId || !composerValue.trim() || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const created = await sendRoomMessage(apiBaseUrl, selectedRoomId, composerValue);
      setComposerValue("");
      setMessages((current) => appendUniqueMessage(current, created));
      setChatError(null);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setIsSending(false);
    }
  }

  function toggleProject(projectId: string): void {
    setExpandedProjectIds((current) => {
      const next = new Set(current);

      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }

      return next;
    });
  }

  function toggleRoom(roomId: string): void {
    setExpandedRoomIds((current) => {
      const next = new Set(current);

      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }

      return next;
    });
  }

  function selectRoom(roomId: string): void {
    selectedRoomIdRef.current = roomId;
    setSelectedRoomId(roomId);
    setActiveSection("Team Chat");
  }

  const selectedRoomName = findSelectedRoomName(projects, selectedRoomId);

  return (
    <div className="app-background h-screen w-screen overflow-hidden text-surface-text">
      <div className="grid h-full w-full grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        <aside className="border-r border-surface-border bg-surface-panelSoft/95 p-4">
          <div className="h-full overflow-y-auto">
            <div className="mb-7 flex items-center gap-3 px-1">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent-warning/50 bg-accent-warning/20 text-lg">
                ☕
              </span>
              <span className="text-4xl font-semibold tracking-tight">Codex</span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveSection(item)}
                  className={`nav-item w-full text-left ${activeSection === item ? "nav-item-active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="mt-8 border-t border-surface-border pt-5">
              <p className="mb-2 px-3 text-xs uppercase tracking-[0.2em] text-surface-muted">Projects & Rooms</p>

              {sidebarError ? (
                <p className="px-3 text-sm text-accent-danger">{sidebarError}</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => {
                    const isProjectExpanded = expandedProjectIds.has(project.id);

                    return (
                      <div key={project.id} className="rounded-lg border border-surface-border bg-surface-panel/65 p-1.5">
                        <button
                          type="button"
                          onClick={() => toggleProject(project.id)}
                          className="nav-item w-full justify-between text-left"
                        >
                          <span>{project.name}</span>
                          <span className="text-xs text-surface-muted">{isProjectExpanded ? "▾" : "▸"}</span>
                        </button>

                        {isProjectExpanded ? (
                          <div className="mt-1 space-y-1 pl-2">
                            {project.rooms.map((room) => {
                              const isRoomExpanded = expandedRoomIds.has(room.id);
                              const roomChannels = buildRoomChannels(room);

                              return (
                                <div key={room.id} className="rounded-md border border-surface-border/60 bg-surface-base/35 p-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      toggleRoom(room.id);
                                      selectRoom(room.id);
                                    }}
                                    className={`nav-item w-full justify-between text-left ${selectedRoomId === room.id ? "nav-item-active" : ""}`}
                                  >
                                    <span># {room.name}</span>
                                    <span className="text-xs text-surface-muted">{isRoomExpanded ? "▾" : "▸"}</span>
                                  </button>

                                  {isRoomExpanded ? (
                                    <div className="mt-1 space-y-1 pl-2">
                                      {roomChannels.map((channel) => (
                                        <button
                                          key={`${room.id}-${channel}`}
                                          type="button"
                                          onClick={() => selectRoom(room.id)}
                                          className="nav-item w-full text-left text-xs"
                                        >
                                          · {channel}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex h-full min-w-0 flex-col border-l border-surface-border bg-surface-canvas/95">
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
            {activeSection === "Overview" ? (
              <OverviewDashboard />
            ) : activeSection === "Team Chat" ? (
              <div className="h-full">
                {isLoadingMessages ? (
                  <section className="panel-surface p-4">
                    <p className="text-sm text-surface-muted">Loading messages...</p>
                  </section>
                ) : selectedRoomId ? (
                  <TeamChatPanel
                    roomName={selectedRoomName}
                    messages={messages}
                    composerValue={composerValue}
                    onComposerChange={setComposerValue}
                    onSendMessage={handleSendMessage}
                    loading={isSending}
                  />
                ) : (
                  <section className="panel-surface p-4">
                    <p className="text-sm text-surface-muted">Select a room in the sidebar to start chatting.</p>
                  </section>
                )}

                {chatError ? <p className="mt-2 text-sm text-accent-danger">{chatError}</p> : null}
              </div>
            ) : (
              <section className="panel-surface p-4">
                <h2 className="text-xl font-semibold sm:text-2xl">{activeSection}</h2>
                <p className="mt-2 text-sm text-surface-muted">
                  This section is scaffolded in the shell and will be implemented in upcoming roadmap tasks.
                </p>
              </section>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}
