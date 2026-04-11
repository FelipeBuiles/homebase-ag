"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipe,
} from "@/lib/db/queries/recipes";
import { executeRecipeParserAgent } from "@/lib/agents/execute";
import { prisma } from "@/lib/db/client";
import { action } from "@/lib/auth/action";
import {
  addGroceryItem,
  buildCanonicalKey,
  getDefaultGroceryList,
  getGroceryListItems,
} from "@/lib/db/queries/groceries";
import { getPantryCoverageForRecipe } from "@/lib/recipes/pantry-coverage";
import { encodeRecipeSource } from "@/lib/grocery-source";

const RecipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  servings: z.number().int().positive().optional(),
  prepMinutes: z.number().int().min(0).optional(),
  cookMinutes: z.number().int().min(0).optional(),
  instructions: z.string().optional(),
});

export const createRecipeAction = action
  .schema(RecipeSchema)
  .action(async ({ parsedInput }) => {
    const recipe = await createRecipe({
      ...parsedInput,
      sourceUrl: parsedInput.sourceUrl || undefined,
      imageUrl: parsedInput.imageUrl || undefined,
      parseStatus: "parsed",
    });
    revalidatePath("/recipes");
    return { recipe };
  });

export const updateRecipeAction = action
  .schema(RecipeSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const recipe = await updateRecipe(id, {
      ...data,
      sourceUrl: data.sourceUrl || undefined,
      imageUrl: data.imageUrl || undefined,
    });
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    return { recipe };
  });

export const deleteRecipeAction = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await deleteRecipe(parsedInput.id);
    revalidatePath("/recipes");
    return { success: true };
  });

export const importFromUrl = action
  .schema(z.object({ url: z.string().url("Please enter a valid URL") }))
  .action(async ({ parsedInput }) => {
    // Create a stub recipe with pending status, then let the agent fill it in
    const recipe = await createRecipe({
      title: "Importing…",
      sourceUrl: parsedInput.url,
      parseStatus: "pending",
    });

    await executeRecipeParserAgent(recipe.id, parsedInput.url);

    revalidatePath("/recipes");
    return { recipe };
  });

export const retryParseAction = action
  .schema(z.object({ recipeId: z.string() }))
  .action(async ({ parsedInput }) => {
    const recipe = await getRecipe(parsedInput.recipeId);
    if (!recipe) return { error: "Recipe not found" };

    await updateRecipe(parsedInput.recipeId, {
      parseStatus: "pending",
      parsingError: undefined,
    });
    // Update parsingUpdatedAt directly
    await prisma.recipe.update({
      where: { id: parsedInput.recipeId },
      data: { parsingUpdatedAt: new Date() },
    });

    if (!recipe.sourceUrl) return { error: "Recipe has no source URL" };

    await executeRecipeParserAgent(parsedInput.recipeId, recipe.sourceUrl);

    revalidatePath(`/recipes/${parsedInput.recipeId}`);
    revalidatePath("/recipes");
    return { success: true };
  });

export const addRecipeToGroceriesAction = action
  .schema(
    z.object({
      recipeId: z.string(),
      listId: z.string().optional(),
      mode: z.enum(["all", "missing"]).optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const recipe = await getRecipe(parsedInput.recipeId);
    if (!recipe) return { error: "Recipe not found" };

    let listId = parsedInput.listId;
    if (!listId) {
      const list = await getDefaultGroceryList();
      listId = list.id;
    }

    const mode = parsedInput.mode ?? "all";
    const existingItems = await getGroceryListItems(listId);
    const existingKeys = new Set(
      existingItems.map((item) => item.canonicalKey ?? buildCanonicalKey(item.name))
    );

    let ingredientsToAdd = recipe.ingredients.map((ing) => ({
      name: ing.normalizedName ?? ing.name ?? ing.raw,
      quantity: ing.quantity ?? undefined,
      unit: ing.unit ?? undefined,
    }));

    if (mode === "missing") {
      const coverage = await getPantryCoverageForRecipe(parsedInput.recipeId);
      if (!coverage) return { error: "Recipe coverage not available" };

      ingredientsToAdd = coverage.ingredients
        .filter((ingredient) => ingredient.status === "missing")
        .map((ingredient) => ({
          name: ingredient.normalizedName ?? ingredient.name ?? ingredient.raw,
          quantity: ingredient.quantity ?? undefined,
          unit: ingredient.unit ?? undefined,
        }));
    }

    const seen = new Set<string>();
    let addedCount = 0;

    for (const ing of ingredientsToAdd) {
      const name = ing.name;
      if (!name) continue;
      const canonicalKey = buildCanonicalKey(name);
      if (seen.has(canonicalKey)) continue;
      if (existingKeys.has(canonicalKey)) continue;
      seen.add(canonicalKey);

      await addGroceryItem(listId, {
        name,
        quantity: ing.quantity ?? undefined,
        unit: ing.unit ?? undefined,
        source: encodeRecipeSource(recipe.title, mode),
        canonicalKey,
      });
      addedCount += 1;
    }

    revalidatePath(`/groceries/${listId}`);
    revalidatePath("/groceries");
    return { listId, addedCount, mode, recipeTitle: recipe.title };
  });
