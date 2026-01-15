import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

import { vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { finalizeRecipe } from "../app/(protected)/recipes/actions";

describe("recipe finalize", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("marks recipe ready when required fields exist", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Test",
        instructions: "Step 1",
        ingredients: { create: [{ name: "Flour" }] },
        status: "draft",
      },
    });

    await finalizeRecipe(recipe.id);

    const stored = await prisma.recipe.findUnique({ where: { id: recipe.id } });
    expect(stored?.status).toBe("ready");
  });

  it("throws if required fields missing", async () => {
    const recipe = await prisma.recipe.create({
      data: { name: "Test", status: "draft" },
    });

    await expect(finalizeRecipe(recipe.id)).rejects.toThrow(/ingredients/i);
  });
});
