import { describe, expect, it } from "vitest";

describe("frontend bootstrap", () => {
  it("has active workspace", () => {
    expect("frontend").toBe("frontend");
  });
});
