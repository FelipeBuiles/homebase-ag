import { PageShell } from "@/components/layout/page-shell";
import { InventoryForm } from "@/components/inventory/inventory-form";

export default function NewInventoryItemPage() {
  return (
    <PageShell title="Add item">
      <div className="mb-4 rounded-xl border border-base-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-400">Inventory tracks durable things</p>
        <p className="mt-1 text-sm text-base-600">
          Use this for household items you want to photograph, tag, locate by room, or keep as part of a longer-lived record.
        </p>
      </div>
      <InventoryForm />
    </PageShell>
  );
}
