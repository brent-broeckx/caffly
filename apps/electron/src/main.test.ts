import { describe, expect, it } from "vitest";

import { bootstrapElectronShell } from "./main.js";

describe("electron bootstrap", () => {
  it("returns initialized state", () => {
    expect(bootstrapElectronShell()).toBe("electron-shell-ready");
  });
});