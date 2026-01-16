import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";
import { clearCheckedItems, clearAllItems } from "../app/(protected)/groceries/actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const createListWithItems = async () => {
  const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
  await prisma.groceryItem.create({ data: { name: "Milk", listId: list.id, isChecked: true } });
  await prisma.groceryItem.create({ data: { name: "Eggs", listId: list.id, isChecked: false } });
  return list;
};

describe("groceries clear actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("clears checked items", async () => {
    const list = await createListWithItems();
    await clearCheckedItems();
    const items = await prisma.groceryItem.findMany({ where: { listId: list.id } });
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Eggs");
  });

  it("clears all items", async () => {
    const list = await createListWithItems();
    await clearAllItems();
    const items = await prisma.groceryItem.findMany({ where: { listId: list.id } });
    expect(items).toHaveLength(0);
  });
});
