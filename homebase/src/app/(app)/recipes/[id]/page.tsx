import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, ExternalLink, Clock, Users, ChefHat, AlertTriangle, Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecipe } from "@/lib/db/queries/recipes";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: PageProps) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return (
    <PageShell
      title={recipe.title}
      action={
        <div className="flex items-center gap-2">
          {recipe.sourceUrl && (
            <Button variant="ghost" size="sm" render={<a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" render={<Link href={`/recipes/${id}/edit`} />}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <DeleteRecipeButton recipeId={id} recipeTitle={recipe.title} />
        </div>
      }
    >
      {recipe.parseStatus === "pending" && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-orange-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Parsing recipe in the background — refresh in a moment.
        </div>
      )}

      {recipe.parseStatus === "failed" && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Recipe parsing failed. You can edit the details manually.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Main content */}
        <div className="space-y-6">
          {recipe.imageUrl && (
            <div className="aspect-video rounded-lg overflow-hidden border border-base-200">
              <Image src={recipe.imageUrl} alt={recipe.title} width={800} height={450} className="w-full h-full object-cover" />
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
        <div className="space-y-4">
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

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div className="rounded-lg border border-base-200 bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-base-100">
                <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide">
                  Ingredients · {recipe.ingredients.length}
                </h3>
              </div>
              <ul className="divide-y divide-base-100">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="px-4 py-2 flex items-baseline gap-2">
                    <span className="text-xs font-mono text-base-500 shrink-0">
                      {[ing.quantity, ing.unit].filter(Boolean).join(" ")}
                    </span>
                    <span className="text-sm text-base-800 flex-1">{ing.name ?? ing.raw}</span>
                    {ing.normalizedName && ing.normalizedName !== ing.name && (
                      <Badge variant="agent" className="text-xs shrink-0">{ing.normalizedName}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
