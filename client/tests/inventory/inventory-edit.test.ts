import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("node:fs", () => ({ promises: { mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn() } }));

import { updateInventoryItem, deleteInventoryAttachment } from "@/app/(protected)/inventory/actions";

describe("inventory edit actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("updates metadata and rooms/tags", async () => {
    const room = await prisma.room.create({ data: { name: "Garage" } });
    const tag = await prisma.tag.create({ data: { name: "Tools" } });
    const item = await prisma.inventoryItem.create({ data: { name: "Saw" } });

    const form = new FormData();
    form.set("name", "Saw Pro");
    form.set("brand", "DeWalt");
    form.set("rooms", room.id);
    form.set("tags", tag.id);

    await updateInventoryItem(item.id, form);

    const updated = await prisma.inventoryItem.findUnique({
      where: { id: item.id },
      include: { rooms: true, tags: true },
    });
    expect(updated?.name).toBe("Saw Pro");
    expect(updated?.brand).toBe("DeWalt");
    expect(updated?.rooms[0]?.name).toBe("Garage");
    expect(updated?.tags[0]?.name).toBe("Tools");
  });

  it("deletes an attachment record", async () => {
    const item = await prisma.inventoryItem.create({ data: { name: "Chair" } });
    const attachment = await prisma.inventoryAttachment.create({
      data: { itemId: item.id, kind: "video", url: "/uploads/inventory/test.mp4", order: 1 },
    });

    await deleteInventoryAttachment(item.id, attachment.id);

    const remaining = await prisma.inventoryAttachment.findMany();
    expect(remaining.length).toBe(0);
  });
});
