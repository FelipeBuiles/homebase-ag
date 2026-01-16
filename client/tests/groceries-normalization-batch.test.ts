import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("../lib/queue", () => ({
  groceryQueue: { add: vi.fn() },
}));

import { enqueueMissingGroceryNormalizations } from "../lib/groceries-normalization-batch";

describe("enqueueMissingGroceryNormalizations", () => {
  afterEach(async () => {
    const { groceryQueue } = await import("../lib/queue");
    vi.mocked(groceryQueue.add).mockClear();
    await resetDb();
  });

  it("enqueues items missing normalized fields", async () => {
    const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
    const missing = await prisma.groceryItem.create({ data: { name: "Milk", listId: list.id } });
    await prisma.groceryItem.create({
      data: { name: "Eggs", listId: list.id, normalizedName: "Eggs", canonicalKey: "eggs" },
    });

    const count = await enqueueMissingGroceryNormalizations();

    const { groceryQueue } = await import("../lib/queue");
    expect(count).toBe(1);
    expect(vi.mocked(groceryQueue.add)).toHaveBeenCalledWith("created", {
      itemId: missing.id,
      name: "Milk",
    });
  });
});
