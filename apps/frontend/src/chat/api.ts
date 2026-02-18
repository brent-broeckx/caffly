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

export async function createProjectRoom(
  apiBaseUrl: string,
  projectId: string,
  name: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ id: string; name: string; projectId: string; createdAt: string }> {
  const response = await fetchImpl(`${trimTrailingSlash(apiBaseUrl)}/api/rooms`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      projectId,
      name
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create room (${response.status})`);
  }

  const payload = (await response.json()) as {
    room: { id: string; name: string; projectId: string; createdAt: string };
  };

  return payload.room;
}

export async function createWorkspaceRoom(
  apiBaseUrl: string,
  name: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ project: { id: string; name: string; slug: string }; room: { id: string; name: string } }> {
  const response = await fetchImpl(`${trimTrailingSlash(apiBaseUrl)}/api/projects/rooms`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error(`Failed to create room (${response.status})`);
  }

  return (await response.json()) as {
    project: { id: string; name: string; slug: string };
    room: { id: string; name: string };
  };
}

export async function deleteProject(apiBaseUrl: string, projectId: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const response = await fetchImpl(`${trimTrailingSlash(apiBaseUrl)}/api/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete project (${response.status})`);
  }
}

export async function deleteRoom(apiBaseUrl: string, roomId: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const response = await fetchImpl(`${trimTrailingSlash(apiBaseUrl)}/api/rooms/${encodeURIComponent(roomId)}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete room (${response.status})`);
  }
}

export async function setProjectVisibility(
  apiBaseUrl: string,
  projectId: string,
  visible: boolean,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(
    `${trimTrailingSlash(apiBaseUrl)}/api/projects/${encodeURIComponent(projectId)}/visibility`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ visible })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update project visibility (${response.status})`);
  }
}

export async function setRoomVisibility(
  apiBaseUrl: string,
  roomId: string,
  visible: boolean,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(
    `${trimTrailingSlash(apiBaseUrl)}/api/rooms/${encodeURIComponent(roomId)}/visibility`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ visible })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update room visibility (${response.status})`);
  }
}
