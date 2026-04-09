import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { getInventoryItem } from "@/lib/db/queries/inventory";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInventoryItemPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getInventoryItem(id);
  if (!item) notFound();

  return (
    <PageShell title={`Edit: ${item.name}`}>
      <InventoryForm item={item} />
    </PageShell>
  );
}
