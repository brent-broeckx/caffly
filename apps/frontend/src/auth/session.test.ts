import { afterEach, describe, expect, it, vi } from "vitest";

import { buildSessionUrl, fetchAuthSession, resolvePostLoginRedirect } from "./session.js";

describe("session helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the auth session URL", () => {
    expect(buildSessionUrl("http://localhost:4000/")).toBe("http://localhost:4000/auth/session");
  });

  it("returns authenticated session when user payload exists", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        user: {
          id: "user-1"
        }
      })
    }));

    const session = await fetchAuthSession("http://localhost:4000", mockFetch as unknown as typeof fetch);

    expect(session?.user?.id).toBe("user-1");
  });

  it("resolves redirect target from query string when valid", () => {
    vi.stubGlobal(
      "window",
      {
        location: {
          search: "?redirectTo=%2Foverview"
        }
      } as Window
    );

    expect(resolvePostLoginRedirect("/app")).toBe("/overview");
  });

  it("falls back to default target for unsafe redirect values", () => {
    vi.stubGlobal(
      "window",
      {
        location: {
          search: "?redirectTo=https://evil.example.com"
        }
      } as Window
    );

    expect(resolvePostLoginRedirect("/app")).toBe("/app");
  });
});
