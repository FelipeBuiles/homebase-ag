import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../lib/queue", () => ({ recipeQueue: { add: vi.fn() } }));

import { createRecipeDraft } from "../app/(protected)/recipes/actions";

describe("recipe drafts", () => {
  afterEach(async () => {
    const { recipeQueue } = await import("../lib/queue");
    vi.mocked(recipeQueue.add).mockClear();
    await resetDb();
  });

  it("creates a draft recipe and enqueues parsing", async () => {
    const recipe = await createRecipeDraft({
      sourceUrl: "https://example.com/recipe",
    });

    const stored = await prisma.recipe.findUnique({ where: { id: recipe.id } });
    expect(stored?.status).toBe("draft");
    expect(stored?.parsingStatus).toBe("pending");
    expect(stored?.sourceUrl).toBe("https://example.com/recipe");

    const { recipeQueue } = await import("../lib/queue");
    expect(vi.mocked(recipeQueue.add)).toHaveBeenCalledWith("parse", {
      recipeId: recipe.id,
      sourceUrl: "https://example.com/recipe",
    });
  });
});
