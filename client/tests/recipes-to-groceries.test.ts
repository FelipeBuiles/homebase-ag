import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";
import { addRecipeIngredientsToGroceries } from "../lib/recipes-to-groceries";

vi.mock("../lib/queue", () => ({
  groceryQueue: { add: vi.fn() },
}));

describe("addRecipeIngredientsToGroceries", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("merges ingredients by canonical key", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Soup",
        status: "ready",
        ingredients: { create: [{ name: "Green onions" }] },
      },
      include: { ingredients: true },
    });

    const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
    await prisma.groceryItem.create({
      data: { name: "Green onions", canonicalKey: "green-onions", listId: list.id, source: "manual" },
    });

    const result = await addRecipeIngredientsToGroceries(recipe.id);

    const items = await prisma.groceryItem.findMany({ where: { listId: list.id } });
    expect(items).toHaveLength(1);
    expect(result.addedCount).toBe(0);
    expect(result.mergedCount).toBe(1);
  });

  it("no-ops when recipe has no ingredients", async () => {
    const recipe = await prisma.recipe.create({ data: { name: "Toast", status: "ready" } });
    const result = await addRecipeIngredientsToGroceries(recipe.id);
    expect(result.addedCount).toBe(0);
    expect(result.mergedCount).toBe(0);
  });
});

describe("addRecipeIngredientsToGroceries queueing", () => {
  afterEach(async () => {
    const { groceryQueue } = await import("../lib/queue");
    vi.mocked(groceryQueue.add).mockClear();
    await resetDb();
  });

  it("enqueues normalization for new items", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Soup",
        status: "ready",
        ingredients: { create: [{ name: "Carrots" }] },
      },
    });

    await addRecipeIngredientsToGroceries(recipe.id);

    const { groceryQueue } = await import("../lib/queue");
    expect(vi.mocked(groceryQueue.add)).toHaveBeenCalledWith("created", expect.objectContaining({
      name: "Carrots",
    }));
  });
});
