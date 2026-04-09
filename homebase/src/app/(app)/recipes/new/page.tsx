import { PageShell } from "@/components/layout/page-shell";
import { RecipeForm } from "@/components/recipes/recipe-form";

export default function NewRecipePage() {
  return (
    <PageShell title="Add recipe">
      <RecipeForm />
    </PageShell>
  );
}
