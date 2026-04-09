import { z } from "zod";
import { getModel } from "@/lib/llm/client";
import { generateJson } from "@/lib/llm/generate-json";
import { updateRecipe, setRecipeIngredients } from "@/lib/db/queries/recipes";

const AGENT_ID = "recipe-parser";

const IngredientSchema = z.object({
  raw: z.string(),
  name: z.string(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  normalizedName: z.string().optional(),
});

const RecipeOutputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  servings: z.number().int().positive().optional(),
  prepMinutes: z.number().int().min(0).optional(),
  cookMinutes: z.number().int().min(0).optional(),
  instructions: z.string().describe("Full instructions as plain text, steps separated by newlines"),
  imageUrl: z.string().optional(),
  ingredients: z.array(IngredientSchema),
});

export async function runRecipeParserAgent(recipeId: string, url: string): Promise<void> {
  // Mark as pending while fetching
  await updateRecipe(recipeId, { parseStatus: "pending" });

  let pageContent: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HomeBase/1.0)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // Strip tags, collapse whitespace — keep it under ~8k chars for the LLM
    pageContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch (err) {
    await updateRecipe(recipeId, { parseStatus: "failed" });
    throw new Error(`Failed to fetch recipe URL: ${err}`);
  }

  const model = await getModel(AGENT_ID, "text");

  try {
    const output = await generateJson({
      model,
      schema: RecipeOutputSchema,
      messages: [
        {
          role: "user",
          content: `Extract the recipe from this webpage content. Normalize each ingredient into name, quantity, and unit. Return the full instructions as plain text.\n\nURL: ${url}\n\nPage content:\n${pageContent}`,
        },
      ],
    });

    await updateRecipe(recipeId, {
      title: output.title,
      description: output.description,
      servings: output.servings,
      prepMinutes: output.prepMinutes,
      cookMinutes: output.cookMinutes,
      instructions: output.instructions,
      imageUrl: output.imageUrl,
      parseStatus: "parsed",
    });

    await setRecipeIngredients(recipeId, output.ingredients);
  } catch (err) {
    await updateRecipe(recipeId, { parseStatus: "failed" });
    throw err;
  }
}
