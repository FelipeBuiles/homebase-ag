"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/lib/db/queries/recipes";
import { agentQueue } from "@/lib/agents/runner";

const action = createSafeActionClient();

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

    await agentQueue.add(
      "recipe-parser",
      { entityId: recipe.id, context: { url: parsedInput.url } },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );

    revalidatePath("/recipes");
    return { recipe };
  });
