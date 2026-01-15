import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { createRecipe } from "../app/(protected)/recipes/actions";

describe("recipe create", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("marks recipe ready when saved manually", async () => {
    const formData = new FormData();
    formData.set("name", "Test Recipe");
    formData.set("description", "");
    formData.set("instructions", "Step 1");
    formData.set("sourceUrl", "");
    formData.set("ingredients", "Flour\nWater");

    await createRecipe(formData);

    const stored = await prisma.recipe.findFirst({ where: { name: "Test Recipe" } });
    expect(stored?.status).toBe("ready");
  });
});
