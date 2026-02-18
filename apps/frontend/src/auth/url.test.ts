import { describe, expect, it } from "vitest";

import { buildGithubSignInUrl } from "./url.js";

describe("buildGithubSignInUrl", () => {
  it("builds the Auth.js supported sign-in URL", () => {
    const url = buildGithubSignInUrl({
      apiBaseUrl: "http://localhost:4000",
      callbackUrl: "http://localhost:3000"
    });

    expect(url).toBe("http://localhost:4000/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000");
  });
});
