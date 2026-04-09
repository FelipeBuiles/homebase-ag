import { describe, expect, it } from "vitest";
import { isRecipePolling } from "@/lib/recipes-polling-status";

describe("isRecipePolling", () => {
  it("returns true for pending parsing status", () => {
    expect(isRecipePolling("pending")).toBe(true);
  });

  it("returns true for parsing status", () => {
    expect(isRecipePolling("parsing")).toBe(true);
  });

  it("returns false for error status", () => {
    expect(isRecipePolling("error")).toBe(false);
  });

  it("returns false for filled status", () => {
    expect(isRecipePolling("filled")).toBe(false);
  });
});
