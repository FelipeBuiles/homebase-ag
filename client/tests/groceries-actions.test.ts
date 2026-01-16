import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../lib/queue", () => ({ groceryQueue: { add: vi.fn() } }));

import { addGroceryItem } from "../app/(protected)/groceries/actions";

describe("groceries actions", () => {
  afterEach(async () => {
    const { groceryQueue } = await import("../lib/queue");
    vi.mocked(groceryQueue.add).mockClear();
    await resetDb();
  });

  it("creates a default list and enqueues normalization", async () => {
    const formData = new FormData();
    formData.set("name", "Milk");

    await addGroceryItem(formData);

    const list = await prisma.groceryList.findFirst({ where: { isDefault: true } });
    expect(list).toBeTruthy();

    const items = await prisma.groceryItem.findMany({ where: { listId: list!.id } });
    expect(items).toHaveLength(1);
    expect(items[0].source).toBe("manual");

    const { groceryQueue } = await import("../lib/queue");
    expect(vi.mocked(groceryQueue.add)).toHaveBeenCalledWith("created", {
      itemId: items[0].id,
      name: "Milk",
      listId: list!.id,
    });
  });
});
