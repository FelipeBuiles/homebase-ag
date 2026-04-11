import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { PantryForm } from "@/components/pantry/pantry-form";

interface PageProps {
  searchParams: Promise<{ name?: string; brand?: string; inventoryItemId?: string }>;
}

export default async function NewPantryItemPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <PageShell title="Add pantry item">
      <div className="mb-4 rounded-xl border border-base-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-400">Pantry tracks consumable food</p>
        <p className="mt-1 text-sm text-base-600">
          Use Pantry for ingredients and food you keep on hand, consume, restock, and plan meals around.
          Durable household items should stay in <Link href="/inventory" className="text-accent-600 hover:underline">Inventory</Link>.
        </p>
      </div>
      <PantryForm
        itemDraft={{
          name: params.name,
          brand: params.brand,
          inventoryItemId: params.inventoryItemId,
        }}
      />
    </PageShell>
  );
}
