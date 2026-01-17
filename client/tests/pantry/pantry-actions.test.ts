import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/queue", () => ({ maintenanceQueue: { add: vi.fn() } }));

import {
  createPantryItem,
  runPantryMaintenance,
  updatePantryItem,
  updatePantryItemStatus,
} from "@/app/(protected)/pantry/actions";

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

  it("queues a maintenance job", async () => {
    await runPantryMaintenance();
    const { maintenanceQueue } = await import("@/lib/queue");
    expect(maintenanceQueue.add).toHaveBeenCalled();
  });

  it("updates pantry item fields", async () => {
    const item = await prisma.pantryItem.create({
      data: {
        name: "Beans",
        quantity: "1",
        unit: "can",
        location: "Pantry",
        status: "in_stock",
      },
    });

    const form = new FormData();
    form.set("name", "Beans");
    form.set("quantity", "2");
    form.set("unit", "cans");
    form.set("location", "Shelf");
    form.set("status", "out_of_stock");

    await updatePantryItem(item.id, form);

    const updated = await prisma.pantryItem.findUnique({ where: { id: item.id } });
    expect(updated?.quantity).toBe("2");
    expect(updated?.location).toBe("Shelf");
    expect(updated?.status).toBe("out_of_stock");
  });
});
