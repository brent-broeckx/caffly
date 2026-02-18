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
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId: params.projectId,
      userId: params.userId,
      project: {
        deletedAt: null
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
      deletedAt: null,
      project: {
        deletedAt: null
      },
      roomMembers: {
        some: {
          userId: params.userId
        }
      }
    }
  });

  if (!room) {
    return null;
  }

  await prisma.projectMember.updateMany({
    where: {
      projectId: room.projectId,
      userId: params.userId,
      hiddenAt: {
        not: null
      }
    },
    data: {
      hiddenAt: null
    }
  });

  await prisma.roomMember.updateMany({
    where: {
      roomId: room.id,
      userId: params.userId,
      hiddenAt: {
        not: null
      }
    },
    data: {
      hiddenAt: null
    }
  });

  return toRoomSummary(room);
}

export async function softDeleteRoomForUser(params: {
  userId: string;
  roomId: string;
}): Promise<void> {
  const roomMembership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId: params.roomId,
        userId: params.userId
      }
    },
    select: {
      role: true
    }
  });

  if (!roomMembership) {
    throw new Error("User is not a room member");
  }

  const room = await prisma.room.findUnique({
    where: {
      id: params.roomId
    },
    select: {
      projectId: true,
      deletedAt: true
    }
  });

  if (!room || room.deletedAt) {
    throw new Error("Room not found");
  }

  const projectMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: room.projectId,
        userId: params.userId
      }
    },
    select: {
      role: true
    }
  });

  const canDelete = roomMembership.role === "owner" || projectMembership?.role === "owner";

  if (!canDelete) {
    throw new Error("Only room or project owners can delete a room");
  }

  await prisma.room.update({
    where: {
      id: params.roomId
    },
    data: {
      deletedAt: new Date()
    }
  });
}

export async function setRoomVisibilityForUser(params: {
  userId: string;
  roomId: string;
  visible: boolean;
}): Promise<void> {
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId: params.roomId,
        userId: params.userId
      }
    },
    select: {
      id: true
    }
  });

  if (!membership) {
    throw new Error("User is not a room member");
  }

  await prisma.roomMember.update({
    where: {
      roomId_userId: {
        roomId: params.roomId,
        userId: params.userId
      }
    },
    data: {
      hiddenAt: params.visible ? null : new Date()
    }
  });
}
