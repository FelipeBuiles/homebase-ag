import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { createPantryItem, updatePantryItemStatus } from "@/app/(protected)/pantry/actions";

describe("pantry actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("creates pantry items with status and location", async () => {
    const form = new FormData();
    form.set("name", "Rice");
    form.set("quantity", "1");
    form.set("unit", "bag");
    form.set("location", "Pantry");
    form.set("status", "in_stock");

    await createPantryItem(form);

    const item = await prisma.pantryItem.findFirst();
    expect(item?.status).toBe("in_stock");
    expect(item?.location).toBe("Pantry");
  });

  it("updates pantry status and timestamp", async () => {
    const item = await prisma.pantryItem.create({
      data: {
        name: "Milk",
        quantity: "1",
        unit: "carton",
        location: "Fridge",
        status: "in_stock",
      },
    });

    await updatePantryItemStatus(item.id, "consumed");

    const updated = await prisma.pantryItem.findUnique({ where: { id: item.id } });
    expect(updated?.status).toBe("consumed");
    expect(updated?.statusUpdatedAt).toBeTruthy();
  });
});
