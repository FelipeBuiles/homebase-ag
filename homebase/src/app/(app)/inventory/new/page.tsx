import { PageShell } from "@/components/layout/page-shell";
import { InventoryForm } from "@/components/inventory/inventory-form";

export default function NewInventoryItemPage() {
  return (
    <PageShell title="Add item">
      <InventoryForm />
    </PageShell>
  );
}
