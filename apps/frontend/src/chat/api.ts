import type { ChatMessage, SidebarResponse } from "./types.js";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export function buildChatWebSocketUrl(apiBaseUrl: string): string {
  const normalized = trimTrailingSlash(apiBaseUrl);
  const url = new URL(normalized);

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chat";

  return url.toString();
}

export async function fetchSidebarData(
  apiBaseUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<SidebarResponse> {
  const response = await fetchImpl(`${trimTrailingSlash(apiBaseUrl)}/api/projects/sidebar`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load sidebar projects (${response.status})`);
  }

  return (await response.json()) as SidebarResponse;
}

export async function fetchRoomMessages(
  apiBaseUrl: string,
  roomId: string,
  fetchImpl: typeof fetch = fetch
): Promise<ChatMessage[]> {
  const response = await fetchImpl(
    `${trimTrailingSlash(apiBaseUrl)}/api/chat/rooms/${encodeURIComponent(roomId)}/messages`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load room messages (${response.status})`);
  }

  const payload = (await response.json()) as { messages: ChatMessage[] };

  return payload.messages;
}

export async function sendRoomMessage(
  apiBaseUrl: string,
  roomId: string,
  content: string,
  fetchImpl: typeof fetch = fetch
): Promise<ChatMessage> {
  const response = await fetchImpl(`${trimTrailingSlash(apiBaseUrl)}/api/chat/messages`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      roomId,
      content,
      type: "TEXT"
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send message (${response.status})`);
  }

  const payload = (await response.json()) as { message: ChatMessage };

  return payload.message;
}
