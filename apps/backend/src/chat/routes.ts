import { MessageType } from "@prisma/client";
import { Router, type Request, type Response } from "express";

import { getAuthenticatedUserFromRequest } from "../auth/session.js";

import type { ChatRealtimeBroadcaster } from "./realtime.js";
import { createRoomMessageForUser, listRoomMessagesForUser } from "./service.js";

const messageTypes = new Set(Object.values(MessageType));

function parseCreateMessageBody(req: Request): {
  roomId?: string;
  content?: string;
  type?: MessageType;
} {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const messageType = typeof body.type === "string" ? body.type : undefined;

  return {
    roomId: typeof body.roomId === "string" ? body.roomId : undefined,
    content: typeof body.content === "string" ? body.content : undefined,
    type: messageType && messageTypes.has(messageType as MessageType) ? (messageType as MessageType) : undefined
  };
}

export function createChatRouter(realtime: ChatRealtimeBroadcaster): Router {
  const router = Router();

  router.get("/rooms/:roomId/messages", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

    if (!roomId) {
      res.status(400).json({ error: "Missing required route param: roomId" });

      return;
    }

    try {
      const messages = await listRoomMessagesForUser({
        userId: authUser.id,
        roomId
      });

      res.status(200).json({ messages });
    } catch (error) {
      res.status(403).json({
        error: "Unable to fetch room messages",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  router.post("/messages", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const body = parseCreateMessageBody(req);

    if (!body.roomId || !body.content?.trim()) {
      res.status(400).json({ error: "Missing required fields: roomId, content" });

      return;
    }

    try {
      const message = await createRoomMessageForUser({
        userId: authUser.id,
        roomId: body.roomId,
        content: body.content,
        type: body.type
      });

      realtime.broadcastMessage(message);

      res.status(201).json({ message });
    } catch (error) {
      res.status(400).json({
        error: "Unable to send message",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return router;
}
