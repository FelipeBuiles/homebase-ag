import { prisma } from "@/lib/db/client";
import { buildCanonicalKey } from "@/lib/db/queries/groceries";
import { getWarnDays } from "@/lib/db/queries/pantry";
import { getExpiryStatus } from "@/lib/pantry-utils";

type CoverageStatus = "covered" | "expiring" | "partial" | "missing";

type PantryCoverageIngredient = {
  ingredientId: string;
  raw: string;
  name: string | null;
  normalizedName: string | null;
  quantity: string | null;
  unit: string | null;
  key: string;
  status: CoverageStatus;
  matchedPantryItemId: string | null;
  matchedPantryItemName: string | null;
};

export type RecipeCoverage = {
  recipeId: string;
  ingredientCount: number;
  coveredIngredientCount: number;
  partialIngredientCount: number;
  missingIngredientCount: number;
  expiringMatchCount: number;
  coverageRatio: number;
  cookNow: boolean;
  usesExpiring: boolean;
  ingredients: PantryCoverageIngredient[];
};

export type PantryRecipeSuggestion = {
  recipeId: string;
  title: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  coverage: RecipeCoverage;
};

export type PantryRecipeSuggestionSections = {
  cookNow: PantryRecipeSuggestion[];
  useSoon: PantryRecipeSuggestion[];
  almostThere: PantryRecipeSuggestion[];
};

type PantryLookupItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  expiresAt: Date | null;
};

function singularizeToken(token: string) {
  if (token.endsWith("ies") && token.length > 3) return `${token.slice(0, -3)}y`;
  if (token.endsWith("oes") && token.length > 3) return token.slice(0, -2);
  if (token.endsWith("ses") && token.length > 3) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1);
  return token;
}

function getCanonicalAliases(value: string) {
  const canonical = buildCanonicalKey(value);
  if (!canonical) return [];

  const tokens = canonical.split(" ");
  const singular = tokens.map(singularizeToken).join(" ");
  return Array.from(new Set([canonical, singular].filter(Boolean)));
}

function getIngredientAliases(input: {
  normalizedName?: string | null;
  name?: string | null;
  raw?: string | null;
}) {
  const sources = [input.normalizedName, input.name, input.raw]
    .filter((value): value is string => Boolean(value?.trim()));

  return Array.from(new Set(sources.flatMap((value) => getCanonicalAliases(value))));
}

function normalizeUnit(unit: string | null | undefined) {
  const value = unit?.trim().toLowerCase();
  if (!value) return null;

  const normalized: Record<string, string> = {
    cans: "can",
    jars: "jar",
    bottles: "bottle",
    cloves: "clove",
    cups: "cup",
    tablespoons: "tbsp",
    tablespoon: "tbsp",
    teaspoons: "tsp",
    teaspoon: "tsp",
    ounces: "oz",
    ounce: "oz",
    pounds: "lb",
    pound: "lb",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    milliliters: "ml",
    milliliter: "ml",
    litres: "l",
    liters: "l",
    liter: "l",
    items: "item",
    units: "unit",
  };

  return normalized[value] ?? singularizeToken(value);
}

function parseNumericQuantity(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fractionMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return Number(fractionMatch[1]) + Number(fractionMatch[2]) / Number(fractionMatch[3]);
  }

  const simpleFractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (simpleFractionMatch) {
    return Number(simpleFractionMatch[1]) / Number(simpleFractionMatch[2]);
  }

  const numeric = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function inferCoverageStatus(args: {
  matchedItem: PantryLookupItem | null;
  warnDays: number;
  ingredientQuantity: string | null;
  ingredientUnit: string | null;
}) {
  const { matchedItem, warnDays, ingredientQuantity, ingredientUnit } = args;
  if (!matchedItem) return "missing" as const;

  const ingredientNumeric = parseNumericQuantity(ingredientQuantity);
  const pantryNumeric = matchedItem.quantity;
  const ingredientNormalizedUnit = normalizeUnit(ingredientUnit);
  const pantryNormalizedUnit = normalizeUnit(matchedItem.unit);
  const comparableUnits =
    ingredientNormalizedUnit == null ||
    pantryNormalizedUnit == null ||
    ingredientNormalizedUnit === pantryNormalizedUnit;

  if (
    ingredientNumeric != null &&
    Number.isFinite(pantryNumeric) &&
    comparableUnits &&
    pantryNumeric < ingredientNumeric
  ) {
    return "partial" as const;
  }

  const matchedExpiry = getExpiryStatus(matchedItem.expiresAt, warnDays);
  return matchedExpiry === "expiring" ? "expiring" as const : "covered" as const;
}

function buildPantryLookup(
  pantryItems: Array<{ id: string; name: string; quantity: number; unit: string | null; expiresAt: Date | null }>,
  warnDays: number
) {
  const lookup = new Map<string, PantryLookupItem[]>();

  for (const item of pantryItems) {
    const expiry = getExpiryStatus(item.expiresAt, warnDays);
    if (expiry === "expired") continue;

    const aliases = getCanonicalAliases(item.name);
    for (const key of aliases) {
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key)!.push(item);
    }
  }

  return lookup;
}

function computeCoverageFromData(
  recipe: {
    id: string;
    ingredients: Array<{
      id: string;
      raw: string;
      name: string | null;
      quantity: string | null;
      unit: string | null;
      normalizedName: string | null;
    }>;
  },
  pantryLookup: Map<string, PantryLookupItem[]>,
  warnDays: number
): RecipeCoverage {
  const ingredients = recipe.ingredients.map((ingredient) => {
    const aliases = getIngredientAliases(ingredient);
    const key = aliases[0] ?? "";
    const matches = aliases.flatMap((alias) => pantryLookup.get(alias) ?? []);
    const matchedItem = matches[0] ?? null;
    const status = inferCoverageStatus({
      matchedItem,
      warnDays,
      ingredientQuantity: ingredient.quantity,
      ingredientUnit: ingredient.unit,
    });

    return {
      ingredientId: ingredient.id,
      raw: ingredient.raw,
      name: ingredient.name,
      normalizedName: ingredient.normalizedName,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      key,
      status,
      matchedPantryItemId: matchedItem?.id ?? null,
      matchedPantryItemName: matchedItem?.name ?? null,
    };
  });

  const ingredientCount = ingredients.length;
  const coveredIngredientCount = ingredients.filter((ingredient) => ingredient.status === "covered" || ingredient.status === "expiring").length;
  const partialIngredientCount = ingredients.filter((ingredient) => ingredient.status === "partial").length;
  const missingIngredientCount = ingredients.filter((ingredient) => ingredient.status === "missing").length;
  const expiringMatchCount = ingredients.filter((ingredient) => ingredient.status === "expiring").length;

  return {
    recipeId: recipe.id,
    ingredientCount,
    coveredIngredientCount,
    partialIngredientCount,
    missingIngredientCount: missingIngredientCount + partialIngredientCount,
    expiringMatchCount,
    coverageRatio: ingredientCount > 0 ? (coveredIngredientCount + partialIngredientCount * 0.5) / ingredientCount : 0,
    cookNow: ingredientCount > 0 && missingIngredientCount === 0 && partialIngredientCount === 0,
    usesExpiring: expiringMatchCount > 0,
    ingredients,
  };
}

export async function getPantryCoverageForRecipe(recipeId: string): Promise<RecipeCoverage | null> {
  const [warnDays, recipe, pantryItems] = await Promise.all([
    getWarnDays(),
    prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        ingredients: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            raw: true,
            name: true,
            quantity: true,
            unit: true,
            normalizedName: true,
          },
        },
      },
    }),
    prisma.pantryItem.findMany({
      where: { status: "in_stock" },
      select: { id: true, name: true, quantity: true, unit: true, expiresAt: true },
    }),
  ]);

  if (!recipe) return null;
  return computeCoverageFromData(recipe, buildPantryLookup(pantryItems, warnDays), warnDays);
}

export async function getPantryCoverageForRecipes(
  recipeIds?: string[]
): Promise<Map<string, RecipeCoverage>> {
  const [warnDays, recipes, pantryItems] = await Promise.all([
    getWarnDays(),
    prisma.recipe.findMany({
      where: {
        parseStatus: "parsed",
        ...(recipeIds ? { id: { in: recipeIds } } : {}),
      },
      select: {
        id: true,
        ingredients: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            raw: true,
            name: true,
            quantity: true,
            unit: true,
            normalizedName: true,
          },
        },
      },
    }),
    prisma.pantryItem.findMany({
      where: { status: "in_stock" },
      select: { id: true, name: true, quantity: true, unit: true, expiresAt: true },
    }),
  ]);

  const pantryLookup = buildPantryLookup(pantryItems, warnDays);

  return new Map(
    recipes.map((recipe) => [
      recipe.id,
      computeCoverageFromData(recipe, pantryLookup, warnDays),
    ])
  );
}

export async function getCookFromPantrySections(limit = 4): Promise<PantryRecipeSuggestionSections> {
  const [warnDays, pantryItems, recipes] = await Promise.all([
    getWarnDays(),
    prisma.pantryItem.findMany({
      where: { status: "in_stock" },
      select: { id: true, name: true, quantity: true, unit: true, expiresAt: true },
    }),
    prisma.recipe.findMany({
      where: { parseStatus: "parsed" },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        sourceUrl: true,
        ingredients: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            raw: true,
            name: true,
            quantity: true,
            unit: true,
            normalizedName: true,
          },
        },
      },
    }),
  ]);

  const pantryLookup = buildPantryLookup(pantryItems, warnDays);
  const enriched = recipes
    .map((recipe) => ({
      recipeId: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      sourceUrl: recipe.sourceUrl,
      coverage: computeCoverageFromData(recipe, pantryLookup, warnDays),
    }))
    .filter((recipe) => recipe.coverage.ingredientCount > 0);

  const byPriority = [...enriched].sort((a, b) => {
    if (b.coverage.expiringMatchCount !== a.coverage.expiringMatchCount) {
      return b.coverage.expiringMatchCount - a.coverage.expiringMatchCount;
    }
    if (b.coverage.coverageRatio !== a.coverage.coverageRatio) {
      return b.coverage.coverageRatio - a.coverage.coverageRatio;
    }
    if (a.coverage.missingIngredientCount !== b.coverage.missingIngredientCount) {
      return a.coverage.missingIngredientCount - b.coverage.missingIngredientCount;
    }
    return a.title.localeCompare(b.title);
  });

  const selected = new Set<string>();

  const takeSection = (items: PantryRecipeSuggestion[]) =>
    items.filter((item) => {
      if (selected.has(item.recipeId)) return false;
      selected.add(item.recipeId);
      return true;
    }).slice(0, limit);

  const cookNow = takeSection(
    byPriority.filter((item) => item.coverage.cookNow)
  );

  const useSoon = takeSection(
    byPriority.filter((item) => item.coverage.usesExpiring && !item.coverage.cookNow)
  );

  const almostThere = takeSection(
    byPriority.filter((item) => !item.coverage.cookNow && item.coverage.coveredIngredientCount > 0)
  );

  return { cookNow, useSoon, almostThere };
}
