import { describe, expect, it } from "vitest";
import { isRecipePending } from "../lib/recipes-status";

describe("isRecipePending", () => {
  it("returns false for a ready recipe", () => {
    expect(
      isRecipePending({
        status: "ready",
        parsingStatus: "filled",
        name: "Soup",
      })
    ).toBe(false);
  });

  it("returns true when parsing is pending", () => {
    expect(
      isRecipePending({
        status: "draft",
        parsingStatus: "pending",
        name: "",
      })
    ).toBe(true);
  });

  it("returns false for a draft with a name and idle parsing", () => {
    expect(
      isRecipePending({
        status: "draft",
        parsingStatus: "idle",
        name: "Pasta",
      })
    ).toBe(false);
  });

  it("returns true for a draft with no name", () => {
    expect(
      isRecipePending({
        status: "draft",
        parsingStatus: "idle",
        name: "",
      })
    ).toBe(true);
  });
});
