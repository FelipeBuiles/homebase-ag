import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/loading-skeleton";
import { listGroceryLists } from "@/lib/db/queries/groceries";
import { GroceryListIndexClient } from "@/components/groceries/grocery-list-index-client";
import { CreateListButton } from "@/components/groceries/create-list-button";
import { getI18n } from "@/lib/i18n/server";

export default async function GroceriesPage() {
  const { t } = await getI18n();

  return (
    <PageShell
      title={t("pages.groceries.title")}
      description={t("pages.groceries.description")}
      action={<CreateListButton />}
    >
      <Suspense fallback={<ListSkeleton />}>
        <GroceryLists />
      </Suspense>
    </PageShell>
  );
}

async function GroceryLists() {
  const lists = await listGroceryLists();

  if (lists.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-10 w-10" />}
        heading="No grocery lists"
        description="Create a shopping list to get started."
      />
    );
  }

  return <GroceryListIndexClient lists={lists} />;
}
