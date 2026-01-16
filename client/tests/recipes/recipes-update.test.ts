import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { updateRecipe } from "@/app/(protected)/recipes/actions";

describe("recipe update", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("updates recipe fields and ingredients", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Original",
        description: "Old",
        instructions: "Step 1",
        status: "ready",
        ingredients: { create: [{ name: "Sugar", quantity: "1", unit: "cup" }] },
      },
      include: { ingredients: true },
    });

    const formData = new FormData();
    formData.set("recipeId", recipe.id);
    formData.set("name", "Updated");
    formData.set("description", "New desc");
    formData.set("instructions", "Step A\nStep B");
    formData.set(
      "ingredientsJson",
      JSON.stringify([
        { name: "Flour", quantity: "2", unit: "cups" },
        { name: "Salt", quantity: "1", unit: "tsp" },
      ])
    );

    await updateRecipe(formData);

    const stored = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: { ingredients: true },
    });

    expect(stored?.name).toBe("Updated");
    expect(stored?.description).toBe("New desc");
    expect(stored?.instructions).toContain("Step A");
    expect(stored?.ingredients.length).toBe(2);
  });
});
