import { prisma } from "@/lib/db/client";

export interface RecipeFilters {
  search?: string;
  parseStatus?: string;
}

export async function listRecipes(filters: RecipeFilters = {}) {
  return prisma.recipe.findMany({
    where: {
      AND: [
        filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {},
        filters.parseStatus ? { parseStatus: filters.parseStatus } : {},
      ],
    },
    include: {
      _count: { select: { ingredients: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecipe(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function createRecipe(data: {
  title: string;
  description?: string;
  sourceUrl?: string;
  imageUrl?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  instructions?: string;
  parseStatus?: string;
}) {
  return prisma.recipe.create({ data });
}

export async function updateRecipe(
  id: string,
  data: {
    title?: string;
    description?: string;
    sourceUrl?: string;
    imageUrl?: string;
    servings?: number;
    prepMinutes?: number;
    cookMinutes?: number;
    instructions?: string;
    parseStatus?: string;
  }
) {
  return prisma.recipe.update({ where: { id }, data });
}

export async function deleteRecipe(id: string) {
  return prisma.recipe.delete({ where: { id } });
}

export async function setRecipeIngredients(
  recipeId: string,
  ingredients: {
    raw: string;
    name?: string;
    quantity?: string;
    unit?: string;
    normalizedName?: string;
    sortOrder?: number;
  }[]
) {
  await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
  if (ingredients.length === 0) return;
  await prisma.recipeIngredient.createMany({
    data: ingredients.map((ing, i) => ({
      recipeId,
      ...ing,
      sortOrder: ing.sortOrder ?? i,
    })),
  });
}
