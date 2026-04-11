import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { getGroceryList } from "@/lib/db/queries/groceries";
import { GroceryDetailClient } from "@/components/groceries/grocery-detail-client";
import { listPendingByEntityIds } from "@/lib/db/queries/proposals";
import { ContextualReviewPanel } from "@/components/review/contextual-review-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroceryListPage({ params }: PageProps) {
  const { id } = await params;
  const list = await getGroceryList(id);
  if (!list) notFound();
  const proposals = await listPendingByEntityIds(
    "grocery-item",
    list.items.map((item) => item.id)
  );
  const entityNames = Object.fromEntries(list.items.map((item) => [item.id, item.name]));

  return (
    <PageShell
      title={list.name}
      backHref="/groceries"
      backLabel="All lists"
    >
      <ContextualReviewPanel
        title="Grocery review"
        description="Normalization suggestions for items in this list."
        proposals={proposals}
        entityNames={entityNames}
      />
      <GroceryDetailClient
        listId={list.id}
        listName={list.name}
        initialItems={list.items}
      />
    </PageShell>
  );
}
