import { PageShell } from "@/components/layout/page-shell";
import { ListSkeleton } from "@/components/layout/loading-skeleton";

export default function InventoryLoading() {
  return (
    <PageShell title="Inventory">
      <ListSkeleton rows={8} />
    </PageShell>
  );
}
