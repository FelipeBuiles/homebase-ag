import { Suspense } from "react";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/loading-skeleton";
import { listInventoryItems, getDistinctFilterValues } from "@/lib/db/queries/inventory";
import { InventoryListClient } from "@/components/inventory/inventory-list-client";
import { FilterChips } from "@/components/inventory/filter-chips";
import { QuickAddPhotoButton } from "@/components/inventory/quick-add-photo-dialog";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string; room?: string; tag?: string }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <PageShell
      title="Inventory"
      action={
        <div className="flex items-center gap-2">
          <QuickAddPhotoButton />
          <Button size="sm" render={<Link href="/inventory/new" />}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      }
    >
      <Suspense fallback={<ListSkeleton />}>
        <InventoryContent params={params} />
      </Suspense>
    </PageShell>
  );
}

async function InventoryContent({
  params,
}: {
  params: { search?: string; category?: string; room?: string; tag?: string };
}) {
  const [items, filterValues] = await Promise.all([
    listInventoryItems(params),
    getDistinctFilterValues(),
  ]);

  return (
    <div className="space-y-4">
      <FilterChips
        filterValues={filterValues}
        active={params}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          heading="No items found"
          description={
            params.search || params.category || params.room || params.tag
              ? "Try adjusting your filters."
              : "Add your first item to get started."
          }
          action={
            !params.search && !params.category && !params.room && !params.tag ? (
              <Button size="sm" render={<Link href="/inventory/new" />}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            ) : undefined
          }
        />
      ) : (
        <InventoryListClient items={items} />
      )}
    </div>
  );
}
