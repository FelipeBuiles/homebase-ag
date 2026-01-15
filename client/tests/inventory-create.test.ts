import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../lib/queue", () => ({ inventoryQueue: { add: vi.fn() } }));
vi.mock("node:fs", () => ({ promises: { mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn() } }));

import { createInventoryItem, quickAddInventoryItem } from "../app/(protected)/inventory/actions";

const buildFile = (name: string, type: string) => new File(["content"], name, { type });

describe("inventory create actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("creates a photo-only item and sets enrichment pending", async () => {
    const form = new FormData();
    form.set("mode", "photo-only");
    form.set("name", "");
    form.append("attachments", buildFile("clip.mp4", "video/mp4"));

    await createInventoryItem(form);

    const item = await prisma.inventoryItem.findFirst({ include: { attachments: true } });
    expect(item?.name).toBe("New item");
    expect(item?.enrichmentStatus).toBe("pending");
    expect(item?.attachments.length).toBe(1);
  });

  it("creates a full item with metadata", async () => {
    const form = new FormData();
    form.set("name", "Camera");
    form.set("description", "Mirrorless");
    form.set("brand", "Sony");
    form.set("model", "A7");
    form.set("condition", "Good");
    form.set("serialNumber", "123");

    await createInventoryItem(form);

    const item = await prisma.inventoryItem.findFirst();
    expect(item?.name).toBe("Camera");
    expect(item?.brand).toBe("Sony");
    expect(item?.serialNumber).toBe("123");
  });

  it("quick-add creates minimal item", async () => {
    const form = new FormData();
    form.set("name", "Lamp");
    await quickAddInventoryItem(form);

    const item = await prisma.inventoryItem.findFirst();
    expect(item?.name).toBe("Lamp");
    expect(item?.categories.length).toBe(0);
  });
});
