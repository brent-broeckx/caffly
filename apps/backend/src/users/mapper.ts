import type { User } from "@prisma/client";

import type { CoreUser } from "./types.js";

export function toCoreUser(user: User): CoreUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? user.image,
    githubUserId: user.githubUserId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}
