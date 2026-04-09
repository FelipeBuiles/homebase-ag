import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getRecipe } from "@/lib/db/queries/recipes";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: PageProps) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  return (
    <PageShell title={`Edit: ${recipe.title}`}>
      <RecipeForm recipe={recipe} />
    </PageShell>
  );
}
