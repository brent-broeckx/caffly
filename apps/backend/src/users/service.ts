import { prisma } from "../db/prisma.js";

import { toCoreUser } from "./mapper.js";
import type { CoreUser, CreateCoreUserInput } from "./types.js";

function normalizeString(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function createCoreUser(input: CreateCoreUserInput): Promise<CoreUser> {
  const created = await prisma.user.create({
    data: {
      username: normalizeString(input.username),
      displayName: normalizeString(input.displayName),
      email: normalizeString(input.email),
      avatarUrl: normalizeString(input.avatarUrl),
      githubUserId: normalizeString(input.githubUserId),
      name: normalizeString(input.displayName)
    }
  });

  return toCoreUser(created);
}

export async function getCoreUserById(id: string): Promise<CoreUser | null> {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  return user ? toCoreUser(user) : null;
}
