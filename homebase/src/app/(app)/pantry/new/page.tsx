import { PageShell } from "@/components/layout/page-shell";
import { PantryForm } from "@/components/pantry/pantry-form";

export default function NewPantryItemPage() {
  return (
    <PageShell title="Add pantry item">
      <PantryForm />
    </PageShell>
  );
}
