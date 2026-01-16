import prisma from "@/lib/prisma";
import { buildCanonicalKey, getOrCreateDefaultGroceryList } from "@/lib/groceries";

export async function addRecipeIngredientsToGroceries(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true },
  });

  if (!recipe || recipe.ingredients.length === 0) {
    return { addedCount: 0, mergedCount: 0 };
  }

  const list = await getOrCreateDefaultGroceryList();
  let addedCount = 0;
  let mergedCount = 0;

  for (const ingredient of recipe.ingredients) {
    const name = ingredient.name?.trim() || "";
    if (!name) continue;

    const canonicalKey = buildCanonicalKey(name);
    const existing = await prisma.groceryItem.findFirst({
      where: { listId: list.id, canonicalKey },
    });

    const quantity = [ingredient.quantity, ingredient.unit]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (existing) {
      mergedCount += 1;
      const mergedFrom = [
        ...(Array.isArray(existing.mergedFrom) ? existing.mergedFrom : []),
        { recipeId, name, quantity },
      ];

      await prisma.groceryItem.update({
        where: { id: existing.id },
        data: {
          mergedFrom,
          quantity: existing.quantity || quantity || null,
        },
      });
      continue;
    }

    await prisma.groceryItem.create({
      data: {
        name,
        normalizedName: name,
        canonicalKey,
        quantity: quantity || null,
        listId: list.id,
        source: "recipe",
      },
    });

    addedCount += 1;
  }

  return { addedCount, mergedCount };
}
