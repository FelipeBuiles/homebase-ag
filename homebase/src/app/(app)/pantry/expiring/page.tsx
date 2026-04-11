import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/loading-skeleton";
import { listPantryItems, getWarnDays } from "@/lib/db/queries/pantry";
import { PantryListClient } from "@/components/pantry/pantry-list-client";
import { ExpirationScanButton } from "@/components/pantry/expiration-scan-button";

export default async function PantryExpiringPage() {
  const warnDays = await getWarnDays();

  return (
    <PageShell
      title="Expiring Items"
      action={
        <div className="flex items-center gap-2">
          <ExpirationScanButton />
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/pantry" />}>
            All pantry
          </Button>
        </div>
      }
    >
      <Suspense fallback={<ListSkeleton />}>
        <ExpiringContent warnDays={warnDays} />
      </Suspense>
    </PageShell>
  );
}

async function ExpiringContent({ warnDays }: { warnDays: number }) {
  const [expiring, expired] = await Promise.all([
    listPantryItems({ tab: "expiring", warnDays, status: "in_stock" }),
    listPantryItems({ tab: "expired", status: "in_stock" }),
  ]);

  const total = expiring.length + expired.length;

  if (total === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-10 w-10" />}
        heading="All clear!"
        description="No pantry items are expiring or expired."
      />
    );
  }

  return (
    <div className="space-y-8">
      {expired.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-danger mb-3">
            Expired · {expired.length}
          </h2>
          <PantryListClient items={expired} warnDays={warnDays} />
        </section>
      )}

      {expiring.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-warning mb-3">
            Expiring soon · {expiring.length}
          </h2>
          <PantryListClient items={expiring} warnDays={warnDays} />
        </section>
      )}
    </div>
  );
}
