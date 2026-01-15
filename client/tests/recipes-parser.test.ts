import { describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

import { applyParsedRecipe } from "../lib/recipes";

describe("recipe parser", () => {
  it("stores parsed fields and marks parsing filled", async () => {
    const recipe = await prisma.recipe.create({ data: { name: "", status: "draft" } });
    const parsed = {
      name: "Soup",
      description: "Warm",
      ingredients: ["Water"],
      instructions: ["Boil"],
    };

    await applyParsedRecipe(recipe.id, parsed);

    const stored = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: { ingredients: true },
    });
    expect(stored?.name).toBe("Soup");
    expect(stored?.parsingStatus).toBe("filled");
    expect(stored?.ingredients.length).toBe(1);

    await resetDb();
  });

  it("stores imageUrl when provided", async () => {
    const recipe = await prisma.recipe.create({ data: { name: "", status: "draft" } });
    const parsed = {
      name: "Soup",
      description: "Warm",
      ingredients: ["Water"],
      instructions: ["Boil"],
      imageUrl: "https://example.com/recipe.jpg",
    };

    await applyParsedRecipe(recipe.id, parsed);

    const stored = await prisma.recipe.findUnique({
      where: { id: recipe.id },
    });

    expect(stored?.imageUrl).toBe("https://example.com/recipe.jpg");

    await resetDb();
  });

  it("does not overwrite existing imageUrl", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "",
        status: "draft",
        imageUrl: "https://example.com/original.jpg",
      },
    });
    const parsed = {
      name: "Soup",
      description: "Warm",
      ingredients: ["Water"],
      instructions: ["Boil"],
      imageUrl: "https://example.com/new.jpg",
    };

    await applyParsedRecipe(recipe.id, parsed);

    const stored = await prisma.recipe.findUnique({
      where: { id: recipe.id },
    });

    expect(stored?.imageUrl).toBe("https://example.com/original.jpg");

    await resetDb();
  });
});
