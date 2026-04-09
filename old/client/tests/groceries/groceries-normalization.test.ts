import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("@/lib/ai", () => ({
  runAgentPrompt: vi.fn(async () => ({
    data: { normalizedName: "Scallion", confidence: 0.9, rationale: "Synonym" },
    raw: "ok",
  })),
}));

import { normalizeGroceryItem } from "@/lib/groceries-normalization";

describe("normalizeGroceryItem", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("writes normalized name + canonical key", async () => {
    const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
    const item = await prisma.groceryItem.create({ data: { name: "Green onions", listId: list.id } });

    await normalizeGroceryItem(item.id, item.name);

    const stored = await prisma.groceryItem.findUnique({ where: { id: item.id } });
    expect(stored?.normalizedName).toBe("Scallion");
    expect(stored?.canonicalKey).toBe("scallion");
  });
});
