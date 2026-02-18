import { prisma } from "../db/prisma.js";
import { listGithubRepositoriesForUser } from "../integrations/github/service.js";

export type SidebarRoom = {
  id: string;
  name: string;
  memberRole: string;
};

export type SidebarProject = {
  id: string;
  name: string;
  slug: string;
  memberRole: string;
  rooms: SidebarRoom[];
};

export type CreatedWorkspaceRoom = {
  project: {
    id: string;
    name: string;
    slug: string;
  };
  room: {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
  };
};

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function buildGithubProjectSlug(externalRepoId: string): string {
  return `gh-${externalRepoId}`;
}

async function syncGithubRepositoryProjectForUser(params: {
  userId: string;
  repository: {
    externalRepoId: string;
    owner: string;
    name: string;
    fullName: string;
    defaultBranch: string | null;
  };
}): Promise<void> {
  const repository = await prisma.repository.upsert({
    where: {
      provider_externalRepoId: {
        provider: "github",
        externalRepoId: params.repository.externalRepoId
      }
    },
    update: {
      owner: params.repository.owner,
      name: params.repository.name,
      fullName: params.repository.fullName,
      defaultBranch: params.repository.defaultBranch
    },
    create: {
      provider: "github",
      externalRepoId: params.repository.externalRepoId,
      owner: params.repository.owner,
      name: params.repository.name,
      fullName: params.repository.fullName,
      defaultBranch: params.repository.defaultBranch
    }
  });

  const projectSlug = buildGithubProjectSlug(params.repository.externalRepoId);
  let project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: {
      id: true,
      name: true,
      createdById: true,
      deletedAt: true
    }
  });

  if (project?.deletedAt) {
    return;
  }

  if (!project) {
    const created = await prisma.project.create({
      data: {
        name: params.repository.name,
        slug: projectSlug,
        description: `GitHub repository: ${params.repository.fullName}`,
        createdById: params.userId,
        members: {
          create: {
            userId: params.userId,
            role: "owner"
          }
        }
      },
      select: {
        id: true,
        name: true,
        createdById: true,
        deletedAt: true
      }
    });

    project = created;
  } else {
    if (project.name !== params.repository.name) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          name: params.repository.name,
          description: `GitHub repository: ${params.repository.fullName}`
        }
      });
    }

    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: params.userId
        }
      },
      update: {},
      create: {
        projectId: project.id,
        userId: params.userId,
        role: "member"
      }
    });
  }

  let room = await prisma.room.findFirst({
    where: {
      projectId: project.id,
      repositoryId: repository.id
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!room) {
    room = await prisma.room.create({
      data: {
        projectId: project.id,
        name: params.repository.name,
        repositoryId: repository.id
      },
      select: {
        id: true,
        name: true
      }
    });
  } else if (room.name !== params.repository.name) {
    await prisma.room.update({
      where: {
        id: room.id
      },
      data: {
        name: params.repository.name
      }
    });
  }

  const projectMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: params.userId
      }
    },
    select: {
      role: true
    }
  });

  await prisma.roomMember.upsert({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId: params.userId
      }
    },
    update: {},
    create: {
      roomId: room.id,
      userId: params.userId,
      role: projectMembership?.role === "owner" ? "owner" : "member"
    }
  });
}

async function syncGithubProjectsForUser(userId: string): Promise<void> {
  const repositories = await listGithubRepositoriesForUser(userId);

  for (const repository of repositories) {
    await syncGithubRepositoryProjectForUser({
      userId,
      repository
    });
  }
}

export async function createWorkspaceRoomForUser(params: {
  userId: string;
  name: string;
}): Promise<CreatedWorkspaceRoom> {
  const roomName = params.name.trim();

  if (!roomName) {
    throw new Error("Room name is required");
  }

  const slugBase = toSlug(roomName) || "room";
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const project = await prisma.project.create({
    data: {
      name: roomName,
      slug,
      description: "Personal workspace room",
      createdById: params.userId,
      members: {
        create: {
          userId: params.userId,
          role: "owner"
        }
      },
      rooms: {
        create: {
          name: roomName,
          roomMembers: {
            create: {
              userId: params.userId,
              role: "owner"
            }
          }
        }
      }
    },
    include: {
      rooms: {
        take: 1,
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  const room = project.rooms[0];

  if (!room) {
    throw new Error("Unable to create room");
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug
    },
    room: {
      id: room.id,
      name: room.name,
      projectId: room.projectId,
      createdAt: room.createdAt.toISOString()
    }
  };
}

export async function getSidebarProjectsForUser(userId: string): Promise<SidebarProject[]> {
  try {
    await syncGithubProjectsForUser(userId);
  } catch {
    void 0;
  }

  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      members: {
        some: {
          userId,
          hiddenAt: null
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      members: {
        where: {
          userId,
          hiddenAt: null
        },
        select: {
          role: true
        },
        take: 1
      },
      rooms: {
        where: {
          deletedAt: null,
          roomMembers: {
            some: {
              userId,
              hiddenAt: null
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        },
        include: {
          roomMembers: {
            where: { userId },
            select: {
              role: true
            },
            take: 1
          }
        }
      }
    }
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    memberRole: project.members[0]?.role ?? "member",
    rooms: project.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      memberRole: room.roomMembers[0]?.role ?? "member"
    }))
  }));
}

export async function softDeleteProjectForUser(params: {
  userId: string;
  projectId: string;
}): Promise<void> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: params.projectId,
        userId: params.userId
      }
    },
    select: {
      role: true
    }
  });

  if (!membership) {
    throw new Error("User is not a project member");
  }

  if (membership.role !== "owner") {
    throw new Error("Only project owners can delete a project");
  }

  const now = new Date();

  await prisma.project.update({
    where: {
      id: params.projectId
    },
    data: {
      deletedAt: now,
      rooms: {
        updateMany: {
          where: {
            deletedAt: null
          },
          data: {
            deletedAt: now
          }
        }
      }
    }
  });
}

export async function setProjectVisibilityForUser(params: {
  userId: string;
  projectId: string;
  visible: boolean;
}): Promise<void> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: params.projectId,
        userId: params.userId
      }
    },
    select: {
      id: true
    }
  });

  if (!membership) {
    throw new Error("User is not a project member");
  }

  await prisma.projectMember.update({
    where: {
      projectId_userId: {
        projectId: params.projectId,
        userId: params.userId
      }
    },
    data: {
      hiddenAt: params.visible ? null : new Date()
    }
  });
}
