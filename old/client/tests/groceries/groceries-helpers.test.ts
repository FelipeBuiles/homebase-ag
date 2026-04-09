import { describe, expect, it } from "vitest";
import { buildCanonicalKey } from "@/lib/groceries";

describe("buildCanonicalKey", () => {
  it("normalizes names into stable lowercase keys", () => {
    expect(buildCanonicalKey("  Green Onions ")).toBe("green-onions");
  });
});
