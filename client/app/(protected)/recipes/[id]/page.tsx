import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRecipe } from "../actions";
import { RecipeEditor } from "../RecipeEditor";
import { PendingRecipeCard } from "../PendingRecipeCard";
import { isRecipePending } from "@/lib/recipes-status";
import { RecipesPolling } from "../RecipesPolling";
import { isRecipePolling } from "@/lib/recipes-polling-status";
import { RetryParsingButton } from "../RetryParsingButton";
import { RecipeImage } from "../RecipeImage";
import { AddToGroceriesButton } from "../AddToGroceriesButton";

async function getRecipe(id: string) {
    try {
        return await prisma.recipe.findUnique({
            where: { id },
            include: { ingredients: true }
        });
    } catch (error) {
        console.error("Failed to load recipe", error);
        return null;
    }
}

export default async function RecipeDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;  
  const recipe = await getRecipe(params.id);
  const isPending = isRecipePending({
    status: recipe?.status,
    parsingStatus: recipe?.parsingStatus,
    name: recipe?.name,
  });

  if (!recipe) return notFound();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link href="/recipes" className="page-eyebrow flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Recipes
          </Link>
          <h1 className="page-title">
            {recipe.name?.trim() ? recipe.name : "Recipe pending"}
          </h1>
          <p className="page-subtitle">
            {isPending ? "We are still parsing this recipe." : "Recipe details and instructions."}
          </p>
        </div>
        <div className="page-actions">
          {!isPending && <AddToGroceriesButton recipeId={recipe.id} />}
          <form action={deleteRecipe.bind(null, recipe.id)}>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 size={14} /> Delete
            </Button>
          </form>
        </div>
      </div>

      {!isPending && (
        <div className="mb-8">
          <RecipeImage
            imageUrl={recipe.imageUrl}
            title={recipe.name?.trim() ? recipe.name : "Recipe"}
            variant="hero"
          />
        </div>
      )}

      {isPending ? (
        <div className="max-w-2xl space-y-4">
          <RecipesPolling pendingIds={isRecipePolling(recipe.parsingStatus) ? [recipe.id] : []} />
          <PendingRecipeCard
            parsingStatus={recipe.parsingStatus}
            variant="detail"
            actions={
              recipe.parsingStatus === "error" && recipe.sourceUrl ? (
                <RetryParsingButton recipeId={recipe.id} />
              ) : null
            }
          />
        </div>
      ) : (
        <RecipeEditor recipe={recipe} />
      )}
    </div>
  );
}
