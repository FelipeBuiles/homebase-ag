import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { getMealPlan } from "@/lib/db/queries/meal-plans";
import { listRecipes } from "@/lib/db/queries/recipes";
import { WeekGridClient } from "@/components/meal-plans/week-grid-client";
import { formatDate } from "@/lib/utils";
import { getPantryCoverageForRecipes } from "@/lib/recipes/pantry-coverage";
import { buildMealPlanPantrySummary } from "@/lib/meal-plans/pantry-summary";
import { listPendingByEntity } from "@/lib/db/queries/proposals";
import { ContextualReviewPanel } from "@/components/review/contextual-review-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MealPlanPage({ params }: PageProps) {
  const { id } = await params;
  const [plan, recipes] = await Promise.all([
    getMealPlan(id),
    listRecipes({ parseStatus: "parsed" }),
  ]);
  if (!plan) notFound();

  const recipeIds = Array.from(
    new Set([...recipes.map((recipe) => recipe.id), ...plan.items.map((item) => item.recipe.id)])
  );
  const coverageByRecipeId = await getPantryCoverageForRecipes(recipeIds);
  const pantrySummary = buildMealPlanPantrySummary(plan.items, coverageByRecipeId);
  const proposals = await listPendingByEntity("meal-plan", id);

  return (
    <PageShell
      title={plan.name}
      backHref="/meal-plans"
      backLabel="All plans"
    >
      <ContextualReviewPanel
        title="Meal plan review"
        description="Chef suggestions for this week can be applied directly here."
        proposals={proposals}
        entityNames={{ [id]: plan.name }}
      />
      <p className="text-sm text-base-500 mb-4">
        Week of {formatDate(plan.weekStart)}
      </p>
      <WeekGridClient
        planId={plan.id}
        planName={plan.name}
        weekStart={plan.weekStart}
        initialItems={plan.items}
        recipes={recipes.map((recipe) => ({
          ...recipe,
          coverage: coverageByRecipeId.get(recipe.id) ?? null,
        }))}
        pantrySummary={pantrySummary}
      />
    </PageShell>
  );
}
