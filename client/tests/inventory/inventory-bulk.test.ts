import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/queue", () => ({ inventoryQueue: { add: vi.fn() } }));

import { bulkUpdateInventoryItems } from "@/app/(protected)/inventory/actions";
import { isInventoryStatusMatch } from "@/lib/inventory";

describe("inventory bulk updates", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("adds categories and rooms", async () => {
    const room = await prisma.room.create({ data: { name: "Basement" } });
    const item = await prisma.inventoryItem.create({ data: { name: "Box", categories: ["Tools"] } });

    const form = new FormData();
    form.append("itemIds", item.id);
    form.append("categories", "Electronics");
    form.append("rooms", room.id);
    form.set("addCategories", "on");
    form.set("addRooms", "on");

    await bulkUpdateInventoryItems(form);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id }, include: { rooms: true } });
    expect(updated?.categories).toEqual(["Tools", "Electronics"]);
    expect(updated?.rooms[0]?.name).toBe("Basement");
  });

  it("clears tags when confirmed", async () => {
    const tag = await prisma.tag.create({ data: { name: "Vintage" } });
    const item = await prisma.inventoryItem.create({
      data: { name: "Radio", tags: { connect: { id: tag.id } } },
    });

    const form = new FormData();
    form.append("itemIds", item.id);
    form.set("clearTags", "on");
    form.set("confirmClear", "on");

    await bulkUpdateInventoryItems(form);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id }, include: { tags: true } });
    expect(updated?.tags.length).toBe(0);
  });
});

describe("inventory status filter helper", () => {
  it("matches needs-enrichment status", () => {
    const item = {
      name: "Chair",
      categories: [],
      rooms: [],
      attachments: [{}],
      enrichmentStatus: "idle",
    };
    expect(isInventoryStatusMatch(item, "needs-enrichment")).toBe(true);
  });
});
