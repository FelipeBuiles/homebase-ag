import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    pantryItem: { findMany: vi.fn() },
    proposal: { create: vi.fn() },
  },
}));

vi.mock("@/lib/ai", () => ({
  runAgentPrompt: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { runAgentPrompt } from "@/lib/ai";
import { processPantryMaintenanceJob } from "@/agents/pantry-maintenance";

describe("pantry maintenance agent", () => {
  it("creates proposals for maintenance actions", async () => {
    vi.mocked(prisma.pantryItem.findMany).mockResolvedValue([
      { id: "p1", name: "Rice", status: "out_of_stock" },
    ] as never);

    vi.mocked(runAgentPrompt).mockResolvedValue({
      data: {
        actions: [
          {
            type: "mark",
            pantryItemId: "p1",
            status: "discarded",
            confidence: 0.9,
            rationale: "stale",
          },
        ],
      },
      raw: "raw",
    });

    await processPantryMaintenanceJob({} as never);

    expect(prisma.proposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: "agent_pantry_maintenance",
        }),
      })
    );
  });
});
