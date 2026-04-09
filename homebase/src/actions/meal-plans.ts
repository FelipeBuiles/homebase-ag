"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMealPlan,
  deleteMealPlan,
  addMealPlanItem,
  removeMealPlanItem,
  getMealPlanForExport,
} from "@/lib/db/queries/meal-plans";
import { createGroceryList, addGroceryItem } from "@/lib/db/queries/groceries";
import { agentQueue } from "@/lib/agents/runner";

const action = createSafeActionClient();

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
    })
  )
  .action(async ({ parsedInput }) => {
    const item = await addMealPlanItem({
      planId: parsedInput.planId,
      recipeId: parsedInput.recipeId,
      date: new Date(parsedInput.date),
      mealType: parsedInput.mealType,
      servings: parsedInput.servings,
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

export const exportToGroceriesAction = action
  .schema(z.object({ planId: z.string() }))
  .action(async ({ parsedInput }) => {
    const plan = await getMealPlanForExport(parsedInput.planId);
    if (!plan) return { error: "Plan not found" };

    // Collect all ingredients across all planned recipes
    const groceryList = await createGroceryList(`${plan.name} — groceries`);

    const seen = new Set<string>();
    for (const item of plan.items) {
      for (const ing of item.recipe.ingredients) {
        const itemName = ing.normalizedName ?? ing.name ?? ing.raw;
        if (!itemName) continue;
        const key = itemName.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        await addGroceryItem(groceryList.id, {
          name: itemName,
          quantity: ing.quantity ?? undefined,
          unit: ing.unit ?? undefined,
        });
      }
    }

    revalidatePath("/groceries");
    redirect(`/groceries/${groceryList.id}`);
  });

export const triggerChefAgentAction = action
  .schema(z.object({ planId: z.string() }))
  .action(async ({ parsedInput }) => {
    await agentQueue.add("chef", { entityId: parsedInput.planId });
    return { queued: true };
  });

export const triggerPantryMaintenanceAction = action
  .schema(z.object({}))
  .action(async () => {
    await agentQueue.add("pantry-maintenance", { entityId: "all" });
    return { queued: true };
  });
