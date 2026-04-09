import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/queue", () => ({ inventoryQueue: { add: vi.fn() } }));

import { requestInventoryEnrichment } from "@/app/(protected)/inventory/actions";
import { approveSelectedChanges } from "@/app/(protected)/review/actions";

describe("inventory enrichment", () => {
  afterEach(async () => {
    const { inventoryQueue } = await import("@/lib/queue");
    vi.mocked(inventoryQueue.add).mockClear();
    await resetDb();
  });

  it("queues enrichment and updates status", async () => {
    const item = await prisma.inventoryItem.create({ data: { name: "Camera" } });
    await requestInventoryEnrichment(item.id);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id } });
    expect(updated?.enrichmentStatus).toBe("pending");
    const { inventoryQueue } = await import("@/lib/queue");
    expect(vi.mocked(inventoryQueue.add)).toHaveBeenCalledWith("enrich", { itemId: item.id });
  });

  it("applies enrichment proposal with rooms", async () => {
    const room = await prisma.room.create({ data: { name: "Office" } });
    const item = await prisma.inventoryItem.create({ data: { name: "Laptop" } });
    const proposal = await prisma.proposal.create({
      data: {
        agentId: "agent_enrichment",
        summary: "Set rooms",
        changes: {
          create: {
            entityType: "InventoryItem",
            entityId: item.id,
            confidence: 0.9,
            rationale: "Test",
            diff: [{ op: "replace", path: "/rooms", value: [room.name] }],
            before: { rooms: [] },
            after: { rooms: [room.name] },
          },
        },
      },
      include: { changes: true },
    });

    await approveSelectedChanges(proposal.id, [proposal.changes[0].id]);

    const updated = await prisma.inventoryItem.findUnique({
      where: { id: item.id },
      include: { rooms: true },
    });
    expect(updated?.rooms[0]?.name).toBe("Office");
  });
});
