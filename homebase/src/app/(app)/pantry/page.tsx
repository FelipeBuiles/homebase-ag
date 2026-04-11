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
import { getCookFromPantrySections } from "@/lib/recipes/pantry-coverage";
import { CookFromPantry } from "@/components/pantry/cook-from-pantry";
import { getRunningLowPantryItems } from "@/lib/db/queries/pantry";
import { getPantryStockSignal } from "@/lib/pantry-utils";
import { RunningLowPanel } from "@/components/pantry/running-low-panel";
import { Input } from "@/components/ui/input";
import { getI18n } from "@/lib/i18n/server";

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
  const { t } = await getI18n();
  const tab = (params.tab as "all" | "expiring" | "expired") ?? "all";
  const [sections, runningLowItems] = await Promise.all([
    getCookFromPantrySections(),
    getRunningLowPantryItems(),
  ]);
  const lowStockItems = runningLowItems.filter((item) => getPantryStockSignal(item) === "low");

  return (
    <PageShell
      title={t("pages.pantry.title")}
      description={t("pages.pantry.description")}
      action={
        <div className="flex items-center gap-2">
          <ExpirationScanButton />
          <Button size="sm" nativeButton={false} render={<Link href="/pantry/new" />}>
            <Plus className="h-4 w-4" />
            {t("pages.pantry.addItem")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <CookFromPantry sections={sections} />
        <RunningLowPanel items={lowStockItems.slice(0, 6)} />

        <div className="rounded-2xl border border-base-200 bg-white p-4 shadow-sm">
          <form method="get" className="flex gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder={t("pages.pantry.searchPlaceholder")}
              className="flex-1"
            />
            {params.tab && <input type="hidden" name="tab" value={params.tab} />}
            <Button type="submit" size="sm" variant="outline">
              {t("common.search")}
            </Button>
          </form>

          <div className="mt-3 flex items-center gap-2">
            {tabs.map((tabOption) => (
              <Link
                key={tabOption.label}
                href={
                  tabOption.value
                    ? `/pantry?tab=${tabOption.value}${params.search ? `&search=${params.search}` : ""}`
                    : `/pantry${params.search ? `?search=${params.search}` : ""}`
                }
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  (tab === tabOption.value || (!params.tab && !tabOption.value))
                    ? "bg-accent-500 text-white"
                    : "bg-base-100 text-base-600 hover:bg-base-200"
                )}
              >
                {tabOption.value === "expiring"
                  ? t("pages.pantry.tab.expiring")
                  : tabOption.value === "expired"
                    ? t("pages.pantry.tab.expired")
                    : t("pages.pantry.tab.all")}
              </Link>
            ))}
          </div>
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
