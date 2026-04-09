import { Suspense } from "react";
import Link from "next/link";
import { Plus, Archive } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/loading-skeleton";
import { listPantryItems, getWarnDays } from "@/lib/db/queries/pantry";
import { PantryListClient } from "@/components/pantry/pantry-list-client";
import { ExpirationScanButton } from "@/components/pantry/expiration-scan-button";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ search?: string; tab?: string }>;
}

const tabs = [
  { value: undefined, label: "All" },
  { value: "expiring", label: "Expiring" },
  { value: "expired", label: "Expired" },
];

export default async function PantryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = (params.tab as "all" | "expiring" | "expired") ?? "all";

  return (
    <PageShell
      title="Pantry"
      action={
        <div className="flex items-center gap-2">
          <ExpirationScanButton />
          <Button size="sm" render={<Link href="/pantry/new" />}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <form method="get" className="flex gap-2">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search pantry..."
            className="flex-1 h-8 rounded-lg border border-base-200 bg-white px-3 text-sm text-base-800 placeholder:text-base-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
          />
          {params.tab && <input type="hidden" name="tab" value={params.tab} />}
        </form>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={
                t.value
                  ? `/pantry?tab=${t.value}${params.search ? `&search=${params.search}` : ""}`
                  : `/pantry${params.search ? `?search=${params.search}` : ""}`
              }
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                (tab === t.value || (!params.tab && !t.value))
                  ? "bg-accent-500 text-white"
                  : "bg-base-100 text-base-600 hover:bg-base-200"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <Suspense fallback={<ListSkeleton />}>
          <PantryList params={params} />
        </Suspense>
      </div>
    </PageShell>
  );
}

async function PantryList({ params }: { params: { search?: string; tab?: string } }) {
  const tab = (params.tab as "all" | "expiring" | "expired") ?? "all";
  const warnDays = await getWarnDays();
  const items = await listPantryItems({
    search: params.search,
    tab: tab === "all" ? undefined : tab,
    warnDays,
  });

  if (items.length === 0) {
    const emptyMessages: Record<string, { heading: string; description: string }> = {
      expiring: {
        heading: "Nothing expiring soon",
        description: "All pantry items are fresh.",
      },
      expired: {
        heading: "No expired items",
        description: "Great — nothing in the pantry has expired.",
      },
    };
    const msg = emptyMessages[tab] ?? {
      heading: "Pantry is empty",
      description: "Add food items to track what you have on hand.",
    };

    return (
      <EmptyState
        icon={<Archive className="h-10 w-10" />}
        heading={msg.heading}
        description={msg.description}
      />
    );
  }

  return <PantryListClient items={items} warnDays={warnDays} />;
}
