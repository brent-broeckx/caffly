import { MessageType } from "@prisma/client";

import { prisma } from "../db/prisma.js";

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  type: MessageType;
  content: string;
  createdAt: string;
};

function toChatMessage(message: {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  createdAt: Date;
  sender: {
    displayName: string | null;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    image: string | null;
  };
}): ChatMessage {
  return {
    id: message.id,
    roomId: message.roomId,
    senderId: message.senderId,
    senderName:
      message.sender.displayName ??
      message.sender.username ??
      message.sender.name ??
      "Unknown",
    senderAvatarUrl: message.sender.avatarUrl ?? message.sender.image,
    type: message.type,
    content: message.content,
    createdAt: message.createdAt.toISOString()
  };
}

export async function isUserRoomMember(params: {
  userId: string;
  roomId: string;
}): Promise<boolean> {
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId: params.roomId,
        userId: params.userId
      }
    },
    select: { id: true }
  });

  return Boolean(membership);
}

export async function listRoomMessagesForUser(params: {
  userId: string;
  roomId: string;
  limit?: number;
}): Promise<ChatMessage[]> {
  const isMember = await isUserRoomMember({
    userId: params.userId,
    roomId: params.roomId
  });

  if (!isMember) {
    throw new Error("User is not a room member");
  }

  const limit = Math.min(Math.max(params.limit ?? 100, 1), 200);

  const messages = await prisma.message.findMany({
    where: { roomId: params.roomId },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      sender: {
        select: {
          displayName: true,
          username: true,
          name: true,
          avatarUrl: true,
          image: true
        }
      }
    }
  });

  return messages.map(toChatMessage);
}

export async function createRoomMessageForUser(params: {
  userId: string;
  roomId: string;
  content: string;
  type?: MessageType;
}): Promise<ChatMessage> {
  const isMember = await isUserRoomMember({
    userId: params.userId,
    roomId: params.roomId
  });

  if (!isMember) {
    throw new Error("User is not a room member");
  }

  const content = params.content.trim();

  if (!content) {
    throw new Error("Message content is required");
  }

  if (content.length > 5000) {
    throw new Error("Message content exceeds maximum length");
  }

  const created = await prisma.message.create({
    data: {
      roomId: params.roomId,
      senderId: params.userId,
      content,
      type: params.type ?? MessageType.TEXT
    },
    include: {
      sender: {
        select: {
          displayName: true,
          username: true,
          name: true,
          avatarUrl: true,
          image: true
        }
      }
    }
  });

  return toChatMessage(created);
}
