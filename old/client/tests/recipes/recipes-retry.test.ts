import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/queue", () => ({ recipeQueue: { add: vi.fn() } }));

import { retryRecipeParsing } from "@/app/(protected)/recipes/actions";

describe("recipe retry parsing", () => {
  afterEach(async () => {
    const { recipeQueue } = await import("@/lib/queue");
    vi.mocked(recipeQueue.add).mockClear();
    await resetDb();
  });

  it("requeues parsing and resets status", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "",
        status: "draft",
        parsingStatus: "error",
        parsingError: "timeout",
        sourceUrl: "https://example.com/recipe",
      },
    });

    await retryRecipeParsing(recipe.id);

    const stored = await prisma.recipe.findUnique({ where: { id: recipe.id } });
    expect(stored?.parsingStatus).toBe("pending");
    expect(stored?.parsingError).toBeNull();

    const { recipeQueue } = await import("@/lib/queue");
    expect(vi.mocked(recipeQueue.add)).toHaveBeenCalledWith("parse", {
      recipeId: recipe.id,
      sourceUrl: "https://example.com/recipe",
    });
  });
});
