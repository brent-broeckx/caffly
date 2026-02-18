import { describe, expect, it } from "vitest";

import { bootstrapBackend } from "./main.js";

describe("backend bootstrap", () => {
  it("returns initialized state", () => {
    expect(bootstrapBackend()).toBe("backend-ready");
  });
});
