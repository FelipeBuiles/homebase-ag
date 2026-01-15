import { describe, expect, it } from "vitest";
import { formatInstructionSteps } from "../lib/recipes-format";

describe("formatInstructionSteps", () => {
  it("splits a block into steps", () => {
    const steps = formatInstructionSteps("Mix. Bake.");
    expect(steps).toEqual(["Mix.", "Bake."]);
  });
});
