import { Inbox } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { ProposalCard } from "@/components/review/proposal-card";
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

  const nameMap = Object.fromEntries([
    ...inventoryItems.map((i) => [i.id, i.name]),
    ...pantryItems.map((i) => [i.id, i.name]),
    ...groceryItems.map((i) => [i.id, i.name]),
    ...mealPlans.map((i) => [i.id, i.name]),
  ]);

  // Group by entityType
  const grouped = proposals.reduce<Record<string, typeof proposals>>((acc, p) => {
    const key = p.entityType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <PageShell title={`Review (${proposals.length})`}>
      <ReviewPoller />
      <div className="space-y-8">
        {Object.entries(grouped).map(([entityType, group]) => (
          <section key={entityType}>
            <h2 className="text-xs font-semibold text-base-500 uppercase tracking-wide mb-3">
              {sectionLabel(entityType)} · {group.length}
            </h2>
            <div className="space-y-3">
              {group.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  entityName={proposal.entityId ? nameMap[proposal.entityId] : undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

function sectionLabel(entityType: string): string {
  const labels: Record<string, string> = {
    inventory: "Inventory",
    "grocery-item": "Groceries",
    pantry: "Pantry",
    recipe: "Recipes",
    "meal-plan": "Meal Plans",
  };
  return labels[entityType] ?? entityType;
}
