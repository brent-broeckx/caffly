import { prisma } from "../db/prisma.js";

export type RoomSummary = {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
};

function toRoomSummary(room: {
  id: string;
  name: string;
  projectId: string;
  createdAt: Date;
}): RoomSummary {
  return {
    id: room.id,
    name: room.name,
    projectId: room.projectId,
    createdAt: room.createdAt.toISOString()
  };
}

export async function createRoomForProject(params: {
  userId: string;
  projectId: string;
  name: string;
}): Promise<RoomSummary> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: params.projectId,
        userId: params.userId
      }
    }
  });

  if (!membership) {
    throw new Error("User is not a project member");
  }

  const room = await prisma.room.create({
    data: {
      projectId: params.projectId,
      name: params.name.trim(),
      roomMembers: {
        create: {
          userId: params.userId,
          role: membership.role === "owner" ? "owner" : "member"
        }
      }
    }
  });

  return toRoomSummary(room);
}

export async function getRoomByIdForUser(params: {
  userId: string;
  roomId: string;
}): Promise<RoomSummary | null> {
  const room = await prisma.room.findFirst({
    where: {
      id: params.roomId,
      roomMembers: {
        some: {
          userId: params.userId
        }
      }
    }
  });

  return room ? toRoomSummary(room) : null;
}
