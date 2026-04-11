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
import { getI18n } from "@/lib/i18n/server";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    room?: string;
    tag?: string;
    enrichmentStatus?: string;
    hasAttachments?: string;
    completeness?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getI18n();

  return (
    <PageShell
      title={t("pages.inventory.title")}
      description={t("pages.inventory.description")}
      action={
        <div className="flex items-center gap-2">
          <QuickAddPhotoButton />
          <Button size="sm" nativeButton={false} render={<Link href="/inventory/new" />}>
            <Plus className="h-4 w-4" />
            {t("pages.inventory.addItem")}
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
  params: {
    search?: string;
    category?: string;
    room?: string;
    tag?: string;
    enrichmentStatus?: string;
    hasAttachments?: string;
    completeness?: string;
  };
}) {
  const filters = {
    search: params.search,
    category: params.category,
    room: params.room,
    tag: params.tag,
    enrichmentStatus: params.enrichmentStatus,
    hasAttachments:
      params.hasAttachments === "yes"
        ? true
        : params.hasAttachments === "no"
          ? false
          : undefined,
    completenessLt: params.completeness === "incomplete" ? 100 : undefined,
  };

  const [items, filterValues] = await Promise.all([
    listInventoryItems(filters),
    getDistinctFilterValues(),
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-base-200 bg-white p-4 shadow-sm">
        <FilterChips
          filterValues={filterValues}
          active={params}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          heading="No items found"
          description={
            params.search || params.category || params.room || params.tag || params.enrichmentStatus || params.hasAttachments || params.completeness
              ? "Try adjusting your filters."
              : "Add your first item to get started."
          }
          action={
            !params.search && !params.category && !params.room && !params.tag && !params.enrichmentStatus && !params.hasAttachments && !params.completeness ? (
              <Button size="sm" nativeButton={false} render={<Link href="/inventory/new" />}>
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
