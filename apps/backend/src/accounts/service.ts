import { prisma } from "../db/prisma.js";
import { getAppConfig } from "../config/env.js";
import { encryptToken } from "../security/token-encryption.js";

import { toCoreAccount } from "./mapper.js";
import type { CoreAccount, LinkAccountInput, OAuthAccountLinkInput } from "./types.js";

const SUPPORTED_AUTH_PROVIDERS = new Set(["github", "gitlab", "azure-devops"]);

function normalizeRequired(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }

  return trimmed;
}

function normalizeOptional(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeProvider(value: string): string {
  const provider = normalizeRequired(value, "provider").toLowerCase();

  if (!SUPPORTED_AUTH_PROVIDERS.has(provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return provider;
}

async function resolveUserIdForOAuthLink(input: {
  provider: string;
  providerAccountId: string;
  email?: string;
  userIdHint?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  githubUserId?: string;
}): Promise<string> {
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: input.provider,
        providerAccountId: input.providerAccountId
      }
    },
    select: {
      userId: true
    }
  });

  if (existingAccount?.userId) {
    return existingAccount.userId;
  }

  if (input.userIdHint) {
    const hintedUser = await prisma.user.findUnique({
      where: { id: input.userIdHint },
      select: { id: true }
    });

    if (hintedUser?.id) {
      return hintedUser.id;
    }
  }

  const normalizedEmail = normalizeOptional(input.email);

  if (normalizedEmail) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    });

    if (userByEmail?.id) {
      return userByEmail.id;
    }
  }

  const createdUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username: normalizeOptional(input.username),
      displayName: normalizeOptional(input.displayName),
      name: normalizeOptional(input.displayName),
      avatarUrl: normalizeOptional(input.avatarUrl),
      image: normalizeOptional(input.avatarUrl),
      githubUserId:
        input.provider === "github" ? normalizeOptional(input.githubUserId) : null
    },
    select: {
      id: true
    }
  });

  return createdUser.id;
}

export async function linkProviderAccount(input: LinkAccountInput): Promise<CoreAccount> {
  const appConfig = getAppConfig();
  const userId = normalizeRequired(input.userId, "userId");
  const provider = normalizeProvider(input.provider);
  const providerAccountId = normalizeRequired(input.providerAccountId, "providerAccountId");
  const type = input.type?.trim() || "oauth";
  const encryptedAccessToken = encryptToken(input.accessToken, appConfig);
  const encryptedRefreshToken = encryptToken(input.refreshToken, appConfig);
  const encryptedIdToken = encryptToken(input.idToken, appConfig);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new Error("Cannot link account: user does not exist");
  }

  const account = await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId
      }
    },
    create: {
      userId,
      type,
      provider,
      providerAccountId,
      access_token: null,
      refresh_token: null,
      id_token: null,
      encryptedAccessToken,
      encryptedRefreshToken,
      encryptedIdToken,
      tokenKeyVersion: 1
    },
    update: {
      userId,
      type,
      access_token: null,
      refresh_token: null,
      id_token: null,
      encryptedAccessToken,
      encryptedRefreshToken,
      encryptedIdToken,
      tokenKeyVersion: 1
    }
  });

  return toCoreAccount(account);
}

export async function listAccountsForUser(userIdInput: string): Promise<CoreAccount[]> {
  const userId = normalizeRequired(userIdInput, "userId");
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { provider: "asc" }
  });

  return accounts.map(toCoreAccount);
}

export async function linkOAuthAccountToUser(input: OAuthAccountLinkInput): Promise<CoreAccount> {
  const provider = normalizeProvider(input.provider);
  const providerAccountId = normalizeRequired(input.providerAccountId, "providerAccountId");

  const targetUserId = await resolveUserIdForOAuthLink({
    provider,
    providerAccountId,
    email: input.email,
    userIdHint: input.userIdHint,
    username: input.username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    githubUserId: input.githubUserId
  });

  return linkProviderAccount({
    userId: targetUserId,
    provider,
    providerAccountId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    idToken: input.idToken,
    type: input.type
  });
}
