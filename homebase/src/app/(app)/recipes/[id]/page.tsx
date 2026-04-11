import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, ExternalLink, Clock, Users, ChefHat, AlertTriangle, Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecipe } from "@/lib/db/queries/recipes";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import { RetryParseButton } from "@/components/recipes/retry-parse-button";
import { ParsePoller } from "@/components/recipes/parse-poller";
import { AddToGroceriesButton } from "@/components/recipes/add-to-groceries-button";
import { getPantryCoverageForRecipe } from "@/lib/recipes/pantry-coverage";
import { cn } from "@/lib/utils";
import { listPendingByEntity } from "@/lib/db/queries/proposals";
import { ContextualReviewPanel } from "@/components/review/contextual-review-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: PageProps) {
  const { id } = await params;
  const [recipe, coverage] = await Promise.all([
    getRecipe(id),
    getPantryCoverageForRecipe(id),
  ]);
  if (!recipe) notFound();
  const proposals = await listPendingByEntity("recipe", id);

  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return (
    <PageShell
      title={recipe.title}
      backHref="/recipes"
      backLabel="All recipes"
      action={
        <div className="flex items-center gap-2">
          {recipe.sourceUrl && (
            <Button variant="ghost" size="sm" nativeButton={false} render={<a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/recipes/${id}/edit`} />}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <DeleteRecipeButton recipeId={id} recipeTitle={recipe.title} />
        </div>
      }
    >
      <ContextualReviewPanel
        title="Recipe review"
        description="Recipe-related agent suggestions for this recipe."
        proposals={proposals}
        entityNames={{ [id]: recipe.title }}
      />

      {recipe.parseStatus === "pending" && (
        <>
          <ParsePoller recipeId={id} />
          <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-orange-700">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Parsing recipe in the background — this page will refresh automatically.
          </div>
        </>
      )}

      {recipe.parseStatus === "failed" && (
        <div className="flex items-center justify-between gap-3 mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Recipe parsing failed.{" "}
              {"parsingError" in recipe && (recipe as { parsingError?: string }).parsingError && (
                <span className="text-red-500">({(recipe as { parsingError?: string }).parsingError})</span>
              )}
            </span>
          </div>
          <RetryParseButton recipeId={id} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
        {/* Main content */}
        <div className="space-y-6 min-w-0">
          {recipe.imageUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden border border-base-200">
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                sizes="(min-width: 1024px) 720px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          {recipe.description && (
            <p className="text-sm text-base-600 leading-relaxed">{recipe.description}</p>
          )}

          {recipe.instructions && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-base-500 uppercase tracking-wide">Instructions</h2>
              <div className="space-y-3">
                {recipe.instructions.split("\n").filter(Boolean).map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs font-mono text-base-400 pt-0.5 shrink-0 w-5">{i + 1}.</span>
                    <p className="text-sm text-base-700 leading-relaxed">{step.replace(/^\d+[\.\)]\s*/, "")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipe.ingredients.length === 0 && recipe.parseStatus === "parsed" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-base-50 border border-base-200 text-sm text-base-500">
              <ChefHat className="h-4 w-4 shrink-0" />
              No ingredients — edit the recipe to add them.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 min-w-0">
          {/* Meta card */}
          <div className="rounded-lg border border-base-200 bg-white p-4 space-y-3">
            {totalMinutes > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-500">Total time</span>
                <span className="flex items-center gap-1 text-sm text-base-800">
                  <Clock className="h-3.5 w-3.5 text-base-400" />
                  {totalMinutes}m
                </span>
              </div>
            )}
            {recipe.prepMinutes && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-500">Prep</span>
                <span className="text-sm text-base-800">{recipe.prepMinutes}m</span>
              </div>
            )}
            {recipe.cookMinutes && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-500">Cook</span>
                <span className="text-sm text-base-800">{recipe.cookMinutes}m</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-500">Servings</span>
                <span className="flex items-center gap-1 text-sm text-base-800">
                  <Users className="h-3.5 w-3.5 text-base-400" />
                  {recipe.servings}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-base-100">
              <span className="text-xs text-base-500">Status</span>
              <Badge variant={recipe.parseStatus === "parsed" ? "success" : recipe.parseStatus === "failed" ? "danger" : "warning"}>
                {recipe.parseStatus}
              </Badge>
            </div>
          </div>

          {/* Add to groceries */}
          {(coverage?.missingIngredientCount ?? 0) > 0 && (
            <AddToGroceriesButton recipeId={id} ingredientCount={coverage?.missingIngredientCount ?? 0} mode="missing" />
          )}

          {coverage && coverage.ingredientCount > 0 && (
            <div className="rounded-lg border border-base-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide">
                  Pantry coverage
                </h3>
                <Badge variant={coverage.cookNow ? "success" : coverage.coveredIngredientCount > 0 ? "warning" : "default"}>
                  {coverage.cookNow ? "Cook now" : `${coverage.coveredIngredientCount + coverage.partialIngredientCount}/${coverage.ingredientCount} matched`}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Metric label="On hand" value={String(coverage.coveredIngredientCount)} />
                <Metric label="Partial" value={String(coverage.partialIngredientCount)} />
                <Metric label="Need" value={String(coverage.missingIngredientCount)} />
                <Metric label="Use soon" value={String(coverage.expiringMatchCount)} />
              </div>

              {coverage.missingIngredientCount > 0 && (
                <p className="text-xs text-base-500">
                  Missing ingredients can be sent straight to groceries from this recipe.
                </p>
              )}
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div className="rounded-lg border border-base-200 bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-base-100">
                <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide">
                  Ingredients · {recipe.ingredients.length}
                </h3>
              </div>
              <ul className="divide-y divide-base-100">
                {recipe.ingredients.map((ing) => {
                  const ingredientCoverage = coverage?.ingredients.find(
                    (coverageIngredient) => coverageIngredient.ingredientId === ing.id
                  );

                  return (
                    <li key={ing.id} className="px-4 py-2 flex items-baseline gap-2">
                      <span className="text-xs font-mono text-base-500 shrink-0">
                        {[ing.quantity, ing.unit].filter(Boolean).join(" ")}
                      </span>
                      <span
                        className={cn(
                          "text-sm flex-1",
                          ingredientCoverage?.status === "expiring" || ingredientCoverage?.status === "partial"
                            ? "text-warning"
                            : "text-base-800"
                        )}
                      >
                        {ing.name ?? ing.raw}
                      </span>
                      {ingredientCoverage?.status === "covered" && (
                        <Badge variant="success" className="text-xs shrink-0">On hand</Badge>
                      )}
                      {ingredientCoverage?.status === "expiring" && (
                        <Badge variant="warning" className="text-xs shrink-0">Use soon</Badge>
                      )}
                      {ingredientCoverage?.status === "missing" && (
                        <Badge variant="default" className="text-xs shrink-0">Missing</Badge>
                      )}
                      {ingredientCoverage?.status === "partial" && (
                        <Badge variant="warning" className="text-xs shrink-0">Partial</Badge>
                      )}
                      {ing.normalizedName && ing.normalizedName !== ing.name && (
                        <Badge variant="agent" className="text-xs shrink-0">{ing.normalizedName}</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-base-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-base-400">{label}</p>
      <p className="text-sm font-medium text-base-800">{value}</p>
    </div>
  );
}
