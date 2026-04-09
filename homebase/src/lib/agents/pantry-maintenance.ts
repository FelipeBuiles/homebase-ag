import { listPantryItems } from "@/lib/db/queries/pantry";
import type { ProposalInput } from "./types";

const AGENT_ID = "pantry-maintenance";
const STALE_DAYS = 60; // items added >60 days ago without interaction

export async function runPantryMaintenanceAgent(): Promise<ProposalInput[]> {
  const items = await listPantryItems();
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const proposals: ProposalInput[] = [];

  for (const item of items) {
    const isStale =
      item.createdAt < staleThreshold &&
      !item.openedAt &&
      !item.expiresAt;

    if (!isStale) continue;

    const daysOld = Math.floor(
      (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const alertMessage = `[Maintenance] Added ${daysOld} days ago with no expiry or opened date. Consider verifying this item is still in stock.`;
    const newNotes = item.notes
      ? `${item.notes}\n\n${alertMessage}`
      : alertMessage;

    proposals.push({
      agentId: AGENT_ID,
      entityType: "pantry",
      entityId: item.id,
      patch: [{ op: "replace", path: "/notes", value: newNotes }],
      snapshot: { id: item.id, name: item.name, notes: item.notes },
      rationale: `"${item.name}" has been in the pantry for ${daysOld} days with no activity.`,
      confidence: 0.75,
      changes: [
        {
          field: "notes",
          before: item.notes ?? null,
          after: newNotes,
        },
      ],
    });
  }

  return proposals;
}
