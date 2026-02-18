import { prisma } from "../db/prisma.js";

export type SidebarRoom = {
  id: string;
  name: string;
  memberRole: string;
};

export type SidebarProject = {
  id: string;
  name: string;
  slug: string;
  rooms: SidebarRoom[];
};

async function ensureDefaultWorkspace(userId: string): Promise<void> {
  const existingMembership = await prisma.projectMember.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (existingMembership) {
    return;
  }

  const slug = `starter-${userId}`;

  await prisma.project.create({
    data: {
      name: "Getting Started",
      slug,
      description: "Default project workspace",
      createdById: userId,
      members: {
        create: {
          userId,
          role: "owner"
        }
      },
      rooms: {
        create: [
          {
            name: "General",
            roomMembers: {
              create: {
                userId,
                role: "owner"
              }
            }
          },
          {
            name: "Dev Sync",
            roomMembers: {
              create: {
                userId,
                role: "member"
              }
            }
          }
        ]
      }
    }
  });
}

export async function getSidebarProjectsForUser(userId: string): Promise<SidebarProject[]> {
  await ensureDefaultWorkspace(userId);

  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      rooms: {
        where: {
          roomMembers: {
            some: {
              userId
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
    rooms: project.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      memberRole: room.roomMembers[0]?.role ?? "member"
    }))
  }));
}
