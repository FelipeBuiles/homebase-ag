import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";
import { addRecipeIngredientsToGroceriesAction } from "../app/(protected)/recipes/actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("addRecipeIngredientsToGroceriesAction", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("adds ingredients to the default list", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Pasta",
        status: "ready",
        ingredients: { create: [{ name: "Tomatoes" }] },
      },
    });

    const result = await addRecipeIngredientsToGroceriesAction(recipe.id);

    const list = await prisma.groceryList.findFirst({ where: { isDefault: true } });
    const items = await prisma.groceryItem.findMany({ where: { listId: list!.id } });
    expect(items).toHaveLength(1);
    expect(result.addedCount).toBe(1);
  });
});
