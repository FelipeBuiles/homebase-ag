"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMealPlan,
  deleteMealPlan,
  addMealPlanItem,
  removeMealPlanItem,
  duplicateMealPlan,
  getMealPlanForExport,
} from "@/lib/db/queries/meal-plans";
import { buildCanonicalKey, createGroceryList, addGroceryItem } from "@/lib/db/queries/groceries";
import { executeChefAgent, executePantryMaintenanceAgent } from "@/lib/agents/execute";
import { action } from "@/lib/auth/action";
import { getPantryCoverageForRecipes } from "@/lib/recipes/pantry-coverage";
import { encodeMealPlanSource } from "@/lib/grocery-source";

export const createMealPlanAction = action
  .schema(
    z.object({
      name: z.string().min(1, "Name is required"),
      weekStart: z.string(), // ISO date string (Monday)
    })
  )
  .action(async ({ parsedInput }) => {
    const plan = await createMealPlan({
      name: parsedInput.name,
      weekStart: new Date(parsedInput.weekStart),
    });
    revalidatePath("/meal-plans");
    return { plan };
  });

export const deleteMealPlanAction = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await deleteMealPlan(parsedInput.id);
    revalidatePath("/meal-plans");
    return { success: true };
  });

export const addMealPlanItemAction = action
  .schema(
    z.object({
      planId: z.string(),
      recipeId: z.string(),
      date: z.string(), // ISO date string
      mealType: z.string(),
      servings: z.number().int().positive().optional(),
      notes: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const item = await addMealPlanItem({
      planId: parsedInput.planId,
      recipeId: parsedInput.recipeId,
      date: new Date(parsedInput.date),
      mealType: parsedInput.mealType,
      servings: parsedInput.servings,
      notes: parsedInput.notes,
    });
    revalidatePath(`/meal-plans/${parsedInput.planId}`);
    return { item };
  });

export const removeMealPlanItemAction = action
  .schema(z.object({ id: z.string(), planId: z.string() }))
  .action(async ({ parsedInput }) => {
    await removeMealPlanItem(parsedInput.id);
    revalidatePath(`/meal-plans/${parsedInput.planId}`);
    return { success: true };
  });

export const duplicateMealPlanAction = action
  .schema(
    z.object({
      sourceId: z.string(),
      name: z.string().min(1, "Name is required"),
      weekStart: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    const plan = await duplicateMealPlan({
      sourceId: parsedInput.sourceId,
      name: parsedInput.name,
      weekStart: new Date(parsedInput.weekStart),
    });
    revalidatePath("/meal-plans");
    return { plan };
  });

export const exportToGroceriesAction = action
  .schema(z.object({ planId: z.string() }))
  .action(async ({ parsedInput }) => {
    const plan = await getMealPlanForExport(parsedInput.planId);
    if (!plan) return { error: "Plan not found" };

    const groceryList = await createGroceryList(`${plan.name} — groceries`);
    const recipeIds = Array.from(new Set(plan.items.map((item) => item.recipe.id)));
    const coverageByRecipeId = await getPantryCoverageForRecipes(recipeIds);

    const seen = new Set<string>();
    for (const item of plan.items) {
      const coverage = coverageByRecipeId.get(item.recipe.id);
      const missingKeys = new Set(
        coverage?.ingredients
          .filter((ingredient) => ingredient.status === "missing")
          .map((ingredient) => ingredient.key) ?? []
      );

      for (const ing of item.recipe.ingredients) {
        const itemName = ing.normalizedName ?? ing.name ?? ing.raw;
        if (!itemName) continue;
        const key = buildCanonicalKey(itemName);
        if (!missingKeys.has(key)) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        await addGroceryItem(groceryList.id, {
          name: itemName,
          quantity: ing.quantity ?? undefined,
          unit: ing.unit ?? undefined,
          source: encodeMealPlanSource(plan.name, "missing"),
        });
      }
    }

    revalidatePath("/groceries");
    redirect(`/groceries/${groceryList.id}`);
  });

export const triggerChefAgentAction = action
  .schema(z.object({ planId: z.string() }))
  .action(async ({ parsedInput }) => {
    const result = await executeChefAgent(parsedInput.planId);
    revalidatePath(`/meal-plans/${parsedInput.planId}`);
    revalidatePath("/review");
    return { success: true, proposalCount: result.proposalCount };
  });

export const triggerPantryMaintenanceAction = action
  .schema(z.object({}))
  .action(async () => {
    const result = await executePantryMaintenanceAgent();
    revalidatePath("/pantry");
    revalidatePath("/review");
    return { success: true, proposalCount: result.proposalCount };
  });
