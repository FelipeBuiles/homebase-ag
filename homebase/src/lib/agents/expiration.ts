import { listPantryItemsForAgent, getWarnDays } from "@/lib/db/queries/pantry";
import type { ProposalInput } from "./types";

const AGENT_ID = "expiration";

export async function runExpirationAgent(): Promise<ProposalInput[]> {
  const [items, warnDays] = await Promise.all([
    listPantryItemsForAgent(),
    getWarnDays(),
  ]);

  const now = new Date();
  const warnDate = new Date(now.getTime() + warnDays * 24 * 60 * 60 * 1000);
  const proposals: ProposalInput[] = [];

  for (const item of items) {
    if (!item.expiresAt) continue;

    const isExpired = item.expiresAt < now;
    const isExpiring = !isExpired && item.expiresAt < warnDate;

    if (!isExpired && !isExpiring) continue;

    const daysUntil = Math.ceil(
      (item.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let noteMessage: string;
    if (isExpired) {
      const daysAgo = Math.abs(daysUntil);
      noteMessage = daysAgo === 0
        ? "Expired today — check if still usable."
        : `Expired ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago — consider discarding.`;
    } else {
      noteMessage = daysUntil === 0
        ? "Expires today — use soon."
        : daysUntil === 1
        ? "Expires tomorrow — use soon."
        : `Expires in ${daysUntil} days — plan to use soon.`;
    }

    const newNotes = item.notes
      ? `${item.notes}\n\n[Expiration alert] ${noteMessage}`
      : `[Expiration alert] ${noteMessage}`;

    proposals.push({
      agentId: AGENT_ID,
      entityType: "pantry",
      entityId: item.id,
      patch: [{ op: "replace", path: "/notes", value: newNotes }],
      snapshot: {
        id: item.id,
        name: item.name,
        expiresAt: item.expiresAt.toISOString(),
        notes: item.notes,
      },
      rationale: isExpired
        ? `${item.name} has expired. Flagging for review.`
        : `${item.name} expires within ${warnDays} days. Flagging for review.`,
      confidence: 1.0,
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
