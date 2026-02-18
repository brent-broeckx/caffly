import type { Server as HttpServer, IncomingMessage } from "node:http";

import WebSocket, { WebSocketServer } from "ws";

import { resolveAuthUserFromSession } from "../auth/session.js";

import { type ChatMessage, isUserRoomMember } from "./service.js";

type ClientContext = {
  socket: WebSocket;
  userId: string;
  roomId?: string;
};

type IncomingClientMessage = {
  type?: string;
  roomId?: string;
};

export type ChatRealtimeBroadcaster = {
  broadcastMessage: (message: ChatMessage) => void;
};

function getRequestOrigin(request: IncomingMessage): string | null {
  const host = request.headers.host;

  if (!host) {
    return null;
  }

  const forwardedProtocol =
    typeof request.headers["x-forwarded-proto"] === "string"
      ? request.headers["x-forwarded-proto"]
      : undefined;
  const socketWithTlsFlag = request.socket as { encrypted?: boolean };
  const protocol = forwardedProtocol ?? (socketWithTlsFlag.encrypted ? "https" : "http");

  return `${protocol}://${host}`;
}

function safeSend(socket: WebSocket, payload: unknown): void {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(payload));
}

export class WsChatRealtimeGateway implements ChatRealtimeBroadcaster {
  private readonly server: WebSocketServer;

  private readonly clients = new Set<ClientContext>();

  constructor(httpServer: HttpServer) {
    this.server = new WebSocketServer({
      server: httpServer,
      path: "/ws/chat"
    });

    this.server.on("connection", (socket, request) => {
      void this.handleConnection(socket, request);
    });
  }

  broadcastMessage(message: ChatMessage): void {
    for (const client of this.clients) {
      if (client.roomId === message.roomId) {
        safeSend(client.socket, {
          type: "message:new",
          message
        });
      }
    }
  }

  private async handleConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
    const origin = getRequestOrigin(request);

    if (!origin) {
      socket.close(1008, "Missing origin");

      return;
    }

    const authUser = await resolveAuthUserFromSession({
      origin,
      cookieHeader: request.headers.cookie
    });

    if (!authUser) {
      socket.close(1008, "Unauthorized");

      return;
    }

    const context: ClientContext = {
      socket,
      userId: authUser.id
    };

    this.clients.add(context);

    safeSend(socket, {
      type: "connected",
      userId: authUser.id
    });

    socket.on("message", (rawMessage) => {
      void this.handleClientMessage(context, rawMessage.toString());
    });

    socket.on("close", () => {
      this.clients.delete(context);
    });

    socket.on("error", () => {
      this.clients.delete(context);
    });
  }

  private async handleClientMessage(client: ClientContext, rawMessage: string): Promise<void> {
    let payload: IncomingClientMessage;

    try {
      payload = JSON.parse(rawMessage) as IncomingClientMessage;
    } catch {
      safeSend(client.socket, {
        type: "error",
        message: "Invalid message payload"
      });

      return;
    }

    if (payload.type !== "subscribe" || !payload.roomId) {
      safeSend(client.socket, {
        type: "error",
        message: "Unsupported event"
      });

      return;
    }

    const isMember = await isUserRoomMember({
      userId: client.userId,
      roomId: payload.roomId
    });

    if (!isMember) {
      safeSend(client.socket, {
        type: "error",
        message: "Access denied for room"
      });

      return;
    }

    client.roomId = payload.roomId;

    safeSend(client.socket, {
      type: "subscribed",
      roomId: payload.roomId
    });
  }
}
