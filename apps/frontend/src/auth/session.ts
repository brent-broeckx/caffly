export type AuthSession = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires?: string;
};

export function buildSessionUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, "");

  return `${base}/auth/session`;
}

export async function fetchAuthSession(
  apiBaseUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<AuthSession | null> {
  const response = await fetchImpl(buildSessionUrl(apiBaseUrl), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as AuthSession | null;

  if (!payload || !payload.user) {
    return null;
  }

  return payload;
}

export function resolvePostLoginRedirect(defaultTarget = "/app"): string {
  if (typeof window === "undefined") {
    return defaultTarget;
  }

  const query = new URLSearchParams(window.location.search);
  const redirectTo = query.get("redirectTo");

  if (!redirectTo) {
    return defaultTarget;
  }

  if (!redirectTo.startsWith("/")) {
    return defaultTarget;
  }

  return redirectTo;
}
