import { useEffect, useMemo, useRef, useState } from "react";
import logoUrl from "../../assets/logo.webp";

import {
  buildChatWebSocketUrl,
  createProjectRoom,
  createWorkspaceRoom,
  deleteProject,
  deleteRoom,
  fetchRoomMessages,
  fetchSidebarData,
  setProjectVisibility,
  setRoomVisibility,
  sendRoomMessage
} from "../chat/api.js";
import type { ChatMessage, ChatWsIncoming, SidebarProject } from "../chat/types.js";
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
  const [creatingProjectId, setCreatingProjectId] = useState<string | null>(null);
  const [deletingTargetId, setDeletingTargetId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

        setSidebarError(null);
        setProjects(payload.projects);
        setCurrentUserId(payload.currentUser?.id ?? null);
        setSelectedRoomId((current) => {
          if (current) {
            return current;
          }

          const firstRoom = payload.projects.flatMap((project) => project.rooms)[0];

          selectedRoomIdRef.current = firstRoom?.id ?? null;

          return firstRoom?.id ?? null;
        });

        const firstProject = payload.projects[0];

        if (firstProject) {
          setExpandedProjectIds(new Set([firstProject.id]));
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

  function selectRoom(roomId: string): void {
    setOpenActionMenuId(null);
    selectedRoomIdRef.current = roomId;
    setSelectedRoomId(roomId);
    setActiveSection("Team Chat");
  }

  function toggleActionMenu(menuId: string): void {
    setOpenActionMenuId((current) => (current === menuId ? null : menuId));
  }

  function resolveNextSelectedRoomId(nextProjects: SidebarProject[], preferredRoomId: string | null): string | null {
    if (preferredRoomId) {
      const hasPreferred = nextProjects.some((project) =>
        project.rooms.some((room) => room.id === preferredRoomId)
      );

      if (hasPreferred) {
        return preferredRoomId;
      }
    }

    return nextProjects.flatMap((project) => project.rooms)[0]?.id ?? null;
  }

  async function reloadSidebar(params?: {
    preferredRoomId?: string | null;
    expandProjectId?: string;
  }): Promise<void> {
    const payload = await fetchSidebarData(apiBaseUrl);
    const nextSelectedRoomId = resolveNextSelectedRoomId(
      payload.projects,
      params?.preferredRoomId ?? selectedRoomIdRef.current
    );

    setProjects(payload.projects);
    setSelectedRoomId(nextSelectedRoomId);
    selectedRoomIdRef.current = nextSelectedRoomId;

    const expandProjectId = params?.expandProjectId;

    if (expandProjectId) {
      setExpandedProjectIds((current) => {
        const next = new Set(current);
        next.add(expandProjectId);

        return next;
      });
    }

    if (!nextSelectedRoomId) {
      setMessages([]);
    }

    setOpenActionMenuId(null);
  }

  async function handleCreateRoom(projectId: string): Promise<void> {
    const roomName = window.prompt("Room name");

    if (!roomName?.trim()) {
      return;
    }

    setCreatingProjectId(projectId);

    try {
      const createdRoom = await createProjectRoom(apiBaseUrl, projectId, roomName.trim());
      await reloadSidebar({
        preferredRoomId: createdRoom.id,
        expandProjectId: projectId
      });
      setActiveSection("Team Chat");
      setSidebarError(null);
      setChatError(null);
      setOpenActionMenuId(null);
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : "Unable to create room");
    } finally {
      setCreatingProjectId(null);
    }
  }

  async function handleCreateWorkspaceRoom(): Promise<void> {
    const roomName = window.prompt("Room name");

    if (!roomName?.trim()) {
      return;
    }

    setCreatingProjectId("workspace");

    try {
      const created = await createWorkspaceRoom(apiBaseUrl, roomName.trim());
      await reloadSidebar({
        preferredRoomId: created.room.id,
        expandProjectId: created.project.id
      });
      setActiveSection("Team Chat");
      setSidebarError(null);
      setChatError(null);
      setOpenActionMenuId(null);
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : "Unable to create room");
    } finally {
      setCreatingProjectId(null);
    }
  }

  async function handleDeleteProject(projectId: string): Promise<void> {
    const shouldDelete = window.confirm("Delete this project and all its rooms from your sidebar?");

    if (!shouldDelete) {
      return;
    }

    setDeletingTargetId(projectId);

    try {
      await deleteProject(apiBaseUrl, projectId);
      await reloadSidebar();
      setSidebarError(null);
      setChatError(null);
      setOpenActionMenuId(null);
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : "Unable to delete project");
    } finally {
      setDeletingTargetId(null);
    }
  }

  async function handleDeleteRoom(roomId: string): Promise<void> {
    const shouldDelete = window.confirm("Delete this room from your sidebar?");

    if (!shouldDelete) {
      return;
    }

    setDeletingTargetId(roomId);

    try {
      await deleteRoom(apiBaseUrl, roomId);
      await reloadSidebar();
      setSidebarError(null);
      setChatError(null);
      setOpenActionMenuId(null);
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : "Unable to delete room");
    } finally {
      setDeletingTargetId(null);
    }
  }

  async function handleHideProject(projectId: string): Promise<void> {
    setDeletingTargetId(`hide-project-${projectId}`);

    try {
      await setProjectVisibility(apiBaseUrl, projectId, false);
      await reloadSidebar();
      setSidebarError(null);
      setChatError(null);
      setOpenActionMenuId(null);
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : "Unable to hide project");
    } finally {
      setDeletingTargetId(null);
    }
  }

  async function handleHideRoom(roomId: string): Promise<void> {
    setDeletingTargetId(`hide-room-${roomId}`);

    try {
      await setRoomVisibility(apiBaseUrl, roomId, false);
      await reloadSidebar();
      setSidebarError(null);
      setChatError(null);
      setOpenActionMenuId(null);
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : "Unable to hide room");
    } finally {
      setDeletingTargetId(null);
    }
  }

  const selectedRoomName = findSelectedRoomName(projects, selectedRoomId);

  return (
    <div className="app-background h-screen w-screen overflow-hidden text-surface-text">
      <div className="grid h-full w-full grid-cols-[250px_minmax(0,1fr)] overflow-hidden py-4">
        <aside className="sidebar px-4 py-4">
          <div className="flex flex-col h-full">
            <div className="mb-4 flex items-center gap-3 px-1">
              <img src={logoUrl} alt="Caffly" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-2xl font-semibold tracking-tight">Caffly</span>
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

            <div className="mt-6 border-t border-surface-border pt-4 flex-1 overflow-hidden">
              <div className="sidebar-scroll">
                <div className="px-3 pb-6">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-surface-muted">
                      Projects & Rooms
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleActionMenu("sidebar-actions")}
                        className="nav-item h-8 w-8 justify-center px-0 text-xl leading-none"
                        title="Sidebar actions"
                      >
                        ⋯
                      </button>

                      {openActionMenuId === "sidebar-actions" ? (
                        <div className="absolute right-0 top-9 z-20 min-w-36 rounded-md border border-surface-border bg-surface-panel p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => void handleCreateWorkspaceRoom()}
                            disabled={creatingProjectId === "workspace"}
                            className="nav-item w-full text-left"
                          >
                            {creatingProjectId === "workspace" ? "Creating..." : "New room"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {sidebarError ? (
                    <p className="px-1 text-sm text-accent-danger">{sidebarError}</p>
                  ) : (
                    <div className="space-y-3">
                      {projects.map((project) => {
                        const isProjectExpanded = expandedProjectIds.has(project.id);

                        return (
                          <div key={project.id} className="project-card">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleProject(project.id)}
                                className="nav-item flex-1 text-left project-toggle"
                                aria-expanded={isProjectExpanded}
                              >
                                <span className="font-medium">{project.name}</span>
                                <span className="chevron" aria-hidden>
                                  {isProjectExpanded ? (
                                    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
                                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
                                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </span>
                              </button>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => toggleActionMenu(`project-${project.id}`)}
                                  className="nav-item h-8 w-8 justify-center px-0 text-xl leading-none"
                                  title="Project actions"
                                >
                                  ⋯
                                </button>

                                {openActionMenuId === `project-${project.id}` ? (
                                  <div className="absolute right-0 top-9 z-20 min-w-36 rounded-md border border-surface-border bg-surface-panel p-1 shadow-lg">
                                    <button
                                      type="button"
                                      onClick={() => void handleCreateRoom(project.id)}
                                      disabled={creatingProjectId === project.id}
                                      className="nav-item w-full text-left"
                                    >
                                      {creatingProjectId === project.id ? "Creating..." : "New room"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleHideProject(project.id)}
                                      disabled={deletingTargetId === `hide-project-${project.id}`}
                                      className="nav-item w-full text-left"
                                    >
                                      {deletingTargetId === `hide-project-${project.id}` ? "Hiding..." : "Hide project"}
                                    </button>
                                    {project.memberRole === "owner" ? (
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteProject(project.id)}
                                        disabled={deletingTargetId === project.id}
                                        className="nav-item w-full text-left"
                                      >
                                        {deletingTargetId === project.id ? "Deleting..." : "Delete project"}
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {isProjectExpanded ? (
                              <div className="mt-1 space-y-1">
                                {project.rooms.map((room) => {
                                  return (
                                    <div key={room.id} className="flex items-center gap-1 room-item">
                                      <button
                                        type="button"
                                        onClick={() => selectRoom(room.id)}
                                        className={`nav-item flex-1 text-left ${selectedRoomId === room.id ? "nav-item-active" : ""}`}
                                      >
                                        <span className="text-sm"># {room.name}</span>
                                      </button>
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => toggleActionMenu(`room-${room.id}`)}
                                          className="nav-item h-8 w-8 justify-center px-0 text-xl leading-none"
                                          title="Room actions"
                                        >
                                          ⋯
                                        </button>

                                        {openActionMenuId === `room-${room.id}` ? (
                                          <div className="absolute right-0 top-9 z-20 min-w-36 rounded-md border border-surface-border bg-surface-panel p-1 shadow-lg">
                                            <button
                                              type="button"
                                              onClick={() => void handleHideRoom(room.id)}
                                              disabled={deletingTargetId === `hide-room-${room.id}`}
                                              className="nav-item w-full text-left"
                                            >
                                              {deletingTargetId === `hide-room-${room.id}` ? "Hiding..." : "Hide room"}
                                            </button>
                                            {project.memberRole === "owner" || room.memberRole === "owner" ? (
                                              <button
                                                type="button"
                                                onClick={() => void handleDeleteRoom(room.id)}
                                                disabled={deletingTargetId === room.id}
                                                className="nav-item w-full text-left"
                                              >
                                                {deletingTargetId === room.id ? "Deleting..." : "Delete room"}
                                              </button>
                                            ) : null}
                                          </div>
                                        ) : null}
                                      </div>
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
            </div>

            <div className="sidebar-footer mt-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleActionMenu("user")}
                  className="nav-item w-full rounded-full"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,167,127,0.08)]">U</span>
                  <span className="ml-3 text-sm">Username</span>
                </button>

                {openActionMenuId === "user" ? (
                  <div className="absolute left-4 bottom-14 z-20 min-w-36 rounded-md border border-surface-border bg-surface-panel p-1 shadow-lg">
                    <button type="button" className="nav-item w-full text-left">Logout</button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <section className="main-panel flex h-full min-w-0 flex-col">
          <main className="min-h-0 flex-1 flex flex-col">
            <div className="py-1">
              <h3 className="text-sm font-medium">{selectedRoomName}</h3>
            </div>

            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-w-0">
                {activeSection === "Overview" ? (
                  <OverviewDashboard />
                ) : activeSection === "Team Chat" ? (
                  <div className="h-full min-h-0">
                    {isLoadingMessages ? (
                      <section className="panel-surface p-4">
                        <p className="text-sm text-surface-muted">Loading messages...</p>
                      </section>
                    ) : selectedRoomId ? (
                      <TeamChatPanel
                        currentUserId={currentUserId}
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
              </div>
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
