import { buildCanonicalKey } from "@/lib/db/queries/groceries";
import type { RecipeCoverage } from "@/lib/recipes/pantry-coverage";

export type MealPlanPantrySummary = {
  plannedMealCount: number;
  fullyCoveredMealCount: number;
  mealsUsingExpiringItems: number;
  uniqueMissingIngredients: Array<{
    key: string;
    name: string;
    recipeIds: string[];
  }>;
};

export function buildMealPlanPantrySummary(
  items: Array<{ recipe: { id: string } }>,
  coverageByRecipeId: Map<string, RecipeCoverage>
): MealPlanPantrySummary {
  const missing = new Map<string, { key: string; name: string; recipeIds: Set<string> }>();
  let fullyCoveredMealCount = 0;
  let mealsUsingExpiringItems = 0;

  for (const item of items) {
    const coverage = coverageByRecipeId.get(item.recipe.id);
    if (!coverage) continue;

    if (coverage.cookNow) fullyCoveredMealCount += 1;
    if (coverage.usesExpiring) mealsUsingExpiringItems += 1;

    for (const ingredient of coverage.ingredients) {
      if (ingredient.status !== "missing") continue;
      const name = ingredient.normalizedName ?? ingredient.name ?? ingredient.raw;
      const key = buildCanonicalKey(name);
      if (!key) continue;

      if (!missing.has(key)) {
        missing.set(key, { key, name, recipeIds: new Set() });
      }
      missing.get(key)!.recipeIds.add(item.recipe.id);
    }
  }

  return {
    plannedMealCount: items.length,
    fullyCoveredMealCount,
    mealsUsingExpiringItems,
    uniqueMissingIngredients: Array.from(missing.values()).map((value) => ({
      key: value.key,
      name: value.name,
      recipeIds: Array.from(value.recipeIds),
    })),
  };
}
