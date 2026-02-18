import type { AuthConfig } from "@auth/core";
import GitHub from "@auth/core/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { linkOAuthAccountToUser } from "../accounts/service.js";
import type { AppConfig } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { encryptToken } from "../security/token-encryption.js";

type GithubProfileShape = {
  id?: string | number;
  login?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
};

function asNonEmpty(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeGithubProfile(profile: unknown): GithubProfileShape {
  if (!profile || typeof profile !== "object") {
    return {};
  }

  const raw = profile as Record<string, unknown>;

  return {
    id: typeof raw.id === "string" || typeof raw.id === "number" ? raw.id : undefined,
    login: typeof raw.login === "string" ? raw.login : undefined,
    name: typeof raw.name === "string" ? raw.name : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    avatar_url: typeof raw.avatar_url === "string" ? raw.avatar_url : undefined
  };
}

function buildProviders(appConfig: AppConfig): AuthConfig["providers"] {
  const clientId = appConfig.githubClientId?.trim();
  const clientSecret = appConfig.githubClientSecret?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required");

    return [];
  }

  return [
    GitHub({
      clientId,
      clientSecret,
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    })
  ];
}

export function buildAuthConfig(appConfig: AppConfig): AuthConfig {
  const secret =
    appConfig.authSecret ??
    appConfig.jwtSecret ??
    "dev-auth-secret-change-before-production";
  const frontendBaseUrl = appConfig.webBaseUrl?.trim() || "http://localhost:5173";
  const backendBaseUrl = "http://localhost:4000";

  return {
    adapter: PrismaAdapter(prisma),
    secret,
    trustHost: true,
    jwt: {
      maxAge: appConfig.jwtMaxAgeSeconds
    },
    session: {
      strategy: "jwt",
      maxAge: appConfig.sessionMaxAgeSeconds,
      updateAge: appConfig.sessionUpdateAgeSeconds
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider !== "github" || !user.id) {
          return true;
        }

        const githubProfile = normalizeGithubProfile(profile);
        await linkOAuthAccountToUser({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          userIdHint: user.id,
          email: asNonEmpty(githubProfile.email) ?? asNonEmpty(user.email ?? undefined) ?? undefined,
          username: asNonEmpty(githubProfile.login) ?? undefined,
          displayName: asNonEmpty(githubProfile.name) ?? asNonEmpty(user.name ?? undefined) ?? undefined,
          avatarUrl: asNonEmpty(githubProfile.avatar_url) ?? asNonEmpty(user.image ?? undefined) ?? undefined,
          githubUserId: githubProfile.id ? String(githubProfile.id) : undefined,
          accessToken: account.access_token ?? undefined,
          refreshToken: account.refresh_token ?? undefined,
          idToken: account.id_token ?? undefined,
          type: account.type
        });

        return true;
      },
      async jwt({ token, user }) {
        if (user?.id) {
          token.sub = user.id;
          token.userId = user.id;
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          const resolvedUserId =
            typeof token.userId === "string"
              ? token.userId
              : typeof token.sub === "string"
                ? token.sub
                : undefined;

          if (resolvedUserId) {
            session.user.id = resolvedUserId;
          }
        }

        return session;
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith("/")) {
          return `${frontendBaseUrl}${url}`;
        }

        try {
          const target = new URL(url);
          const allowedOrigins = new Set([
            new URL(frontendBaseUrl).origin,
            new URL(baseUrl).origin,
            new URL(backendBaseUrl).origin
          ]);

          if (allowedOrigins.has(target.origin)) {
            return target.toString();
          }
        } catch {
          return frontendBaseUrl;
        }

        return frontendBaseUrl;
      }
    },
    events: {
      async linkAccount({ account }) {
        const provider = account.provider?.toLowerCase();
        const providerAccountId = account.providerAccountId;

        if (!provider || !providerAccountId) {
          return;
        }

        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId
            }
          },
          data: {
            access_token: null,
            refresh_token: null,
            id_token: null,
            encryptedAccessToken: encryptToken(account.access_token, appConfig),
            encryptedRefreshToken: encryptToken(account.refresh_token, appConfig),
            encryptedIdToken: encryptToken(account.id_token, appConfig),
            tokenKeyVersion: 1
          }
        });
      }
    },
    providers: buildProviders(appConfig)
  };
}
