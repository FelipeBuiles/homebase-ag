import { describe, expect, it } from "vitest";
import { mergeParsedRecipe } from "@/lib/recipes";

describe("mergeParsedRecipe", () => {
  it("applies parsed fields unless edited", () => {
    const current = {
      name: "",
      description: "",
      instructions: "",
      ingredients: [],
    };
    const parsed = {
      name: "Pasta",
      description: "Quick dinner",
      instructions: "Boil",
      ingredients: [{ name: "Pasta" }],
    };

    const result = mergeParsedRecipe(current, parsed, { name: true });
    expect(result.name).toBe("");
    expect(result.description).toBe("Quick dinner");
  });
});
