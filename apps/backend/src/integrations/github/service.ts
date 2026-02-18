import { prisma } from "../../db/prisma.js";
import { getAppConfig } from "../../config/env.js";
import { decryptToken } from "../../security/token-encryption.js";

type ValidateGithubAccessInput = {
  userId?: string;
  providerAccountId?: string;
};

export type GithubRepositorySummary = {
  externalRepoId: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string | null;
};

type GithubValidationResult = {
  ok: boolean;
  provider: "github";
  account: {
    userId: string;
    providerAccountId: string;
  };
  githubUser?: {
    id: number;
    login: string;
    name: string | null;
  };
  statusCode: number;
  message: string;
};

function normalizeOptional(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

async function resolveGithubAccount(input: ValidateGithubAccessInput) {
  const providerAccountId = normalizeOptional(input.providerAccountId);
  const userId = normalizeOptional(input.userId);

  if (providerAccountId) {
    return prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId
        }
      },
      select: {
        userId: true,
        providerAccountId: true,
        encryptedAccessToken: true
      }
    });
  }

  if (userId) {
    return prisma.account.findFirst({
      where: {
        userId,
        provider: "github"
      },
      orderBy: {
        id: "asc"
      },
      select: {
        userId: true,
        providerAccountId: true,
        encryptedAccessToken: true
      }
    });
  }

  throw new Error("userId or providerAccountId is required");
}

function parseLinkHeaderNextUrl(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }

  const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/i);

  return nextMatch?.[1] ?? null;
}

export async function listGithubRepositoriesForUser(userId: string): Promise<GithubRepositorySummary[]> {
  const account = await resolveGithubAccount({ userId });

  if (!account) {
    return [];
  }

  const appConfig = getAppConfig();
  const accessToken = decryptToken(account.encryptedAccessToken, appConfig);

  if (!accessToken) {
    return [];
  }

  const repositories: GithubRepositorySummary[] = [];
  let nextUrl: string | null =
    "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member";

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "devchat-mvp"
      }
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      default_branch?: string | null;
      owner?: { login?: string };
    }>;

    for (const repo of payload) {
      if (!repo?.id || !repo?.name || !repo?.full_name) {
        continue;
      }

      repositories.push({
        externalRepoId: String(repo.id),
        owner: repo.owner?.login ?? "unknown",
        name: repo.name,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch ?? null
      });
    }

    nextUrl = parseLinkHeaderNextUrl(response.headers.get("link"));
  }

  return repositories;
}

export async function validateGithubApiAccess(
  input: ValidateGithubAccessInput
): Promise<GithubValidationResult> {
  const account = await resolveGithubAccount(input);

  if (!account) {
    return {
      ok: false,
      provider: "github",
      account: {
        userId: "",
        providerAccountId: ""
      },
      statusCode: 404,
      message: "No linked GitHub account found"
    };
  }

  const appConfig = getAppConfig();
  const accessToken = decryptToken(account.encryptedAccessToken, appConfig);

  if (!accessToken) {
    return {
      ok: false,
      provider: "github",
      account: {
        userId: account.userId,
        providerAccountId: account.providerAccountId
      },
      statusCode: 400,
      message: "No encrypted access token available for this linked account"
    };
  }

  const response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "devchat-mvp"
    }
  });

  if (!response.ok) {
    const responseText = await response.text();

    return {
      ok: false,
      provider: "github",
      account: {
        userId: account.userId,
        providerAccountId: account.providerAccountId
      },
      statusCode: response.status,
      message: responseText || "GitHub API access validation failed"
    };
  }

  const payload = (await response.json()) as {
    id: number;
    login: string;
    name: string | null;
  };

  return {
    ok: true,
    provider: "github",
    account: {
      userId: account.userId,
      providerAccountId: account.providerAccountId
    },
    githubUser: {
      id: payload.id,
      login: payload.login,
      name: payload.name
    },
    statusCode: response.status,
    message: "GitHub API access validated"
  };
}
