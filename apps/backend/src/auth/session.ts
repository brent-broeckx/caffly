import type { Request } from "express";

export type AuthenticatedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type SessionResponse = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

function parseAuthenticatedUser(payload: SessionResponse | null): AuthenticatedUser | null {
  if (!payload?.user?.id) {
    return null;
  }

  return {
    id: payload.user.id,
    name: payload.user.name,
    email: payload.user.email,
    image: payload.user.image
  };
}

export async function resolveAuthUserFromSession(params: {
  origin: string;
  cookieHeader?: string;
}): Promise<AuthenticatedUser | null> {
  if (!params.cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${params.origin}/auth/session`, {
      method: "GET",
      headers: {
        cookie: params.cookieHeader,
        accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as SessionResponse | null;

    return parseAuthenticatedUser(payload);
  } catch {
    return null;
  }
}

export async function getAuthenticatedUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const host = req.get("host");

  if (!host) {
    return null;
  }

  return resolveAuthUserFromSession({
    origin: `${req.protocol}://${host}`,
    cookieHeader: req.headers.cookie
  });
}
