import { Inbox } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { ReviewClient } from "@/components/review/review-client";
import { ReviewPoller } from "@/components/review/review-poller";
import { listPendingProposals } from "@/lib/db/queries/proposals";
import { prisma } from "@/lib/db/client";

export default async function ReviewPage() {
  const proposals = await listPendingProposals();

  if (proposals.length === 0) {
    return (
      <PageShell title="Review">
        <ReviewPoller />
        <EmptyState
          icon={<Inbox className="h-10 w-10" />}
          heading="Nothing to review"
          description="Agent proposals will appear here for your approval."
        />
      </PageShell>
    );
  }

  // Load entity names for all proposal types
  const inventoryIds = proposals
    .filter((p) => p.entityType === "inventory" && p.entityId)
    .map((p) => p.entityId!);

  const pantryIds = proposals
    .filter((p) => p.entityType === "pantry" && p.entityId)
    .map((p) => p.entityId!);

  const groceryItemIds = proposals
    .filter((p) => p.entityType === "grocery-item" && p.entityId)
    .map((p) => p.entityId!);

  const mealPlanIds = proposals
    .filter((p) => p.entityType === "meal-plan" && p.entityId)
    .map((p) => p.entityId!);

  const [inventoryItems, pantryItems, groceryItems, mealPlans] = await Promise.all([
    inventoryIds.length > 0
      ? prisma.inventoryItem.findMany({
          where: { id: { in: inventoryIds } },
          select: { id: true, name: true },
        })
      : [],
    pantryIds.length > 0
      ? prisma.pantryItem.findMany({
          where: { id: { in: pantryIds } },
          select: { id: true, name: true },
        })
      : [],
    groceryItemIds.length > 0
      ? prisma.groceryItem.findMany({
          where: { id: { in: groceryItemIds } },
          select: { id: true, name: true },
        })
      : [],
    mealPlanIds.length > 0
      ? prisma.mealPlan.findMany({
          where: { id: { in: mealPlanIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const entityNames = Object.fromEntries([
    ...inventoryItems.map((i) => [i.id, i.name]),
    ...pantryItems.map((i) => [i.id, i.name]),
    ...groceryItems.map((i) => [i.id, i.name]),
    ...mealPlans.map((i) => [i.id, i.name]),
  ]);

  return (
    <PageShell title={`Review (${proposals.length})`}>
      <ReviewPoller />
      <ReviewClient proposals={proposals} entityNames={entityNames} />
    </PageShell>
  );
}
