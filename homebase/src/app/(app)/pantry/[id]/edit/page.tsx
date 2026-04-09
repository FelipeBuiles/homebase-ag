import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { PantryForm } from "@/components/pantry/pantry-form";
import { getPantryItem } from "@/lib/db/queries/pantry";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPantryItemPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getPantryItem(id);
  if (!item) notFound();

  return (
    <PageShell title={`Edit ${item.name}`}>
      <PantryForm item={item} />
    </PageShell>
  );
}
