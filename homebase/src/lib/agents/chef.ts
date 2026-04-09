import { z } from "zod";
import { getModel } from "@/lib/llm/client";
import { generateJson } from "@/lib/llm/generate-json";
import { getMealPlan } from "@/lib/db/queries/meal-plans";
import { listPantryItems } from "@/lib/db/queries/pantry";
import { listRecipes } from "@/lib/db/queries/recipes";
import type { ProposalInput } from "./types";

const AGENT_ID = "chef";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

const ChefOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      dayOffset: z
        .number()
        .int()
        .min(0)
        .max(6)
        .describe("Day of week: 0=Monday, 6=Sunday"),
      mealType: z.enum(["Breakfast", "Lunch", "Dinner"]).describe("Meal type"),
      recipeId: z.string().describe("Recipe ID from the provided list"),
      recipeTitle: z.string().describe("Recipe title"),
      reasoning: z.string().describe("Brief reason for this suggestion"),
    })
  ),
  overallRationale: z.string().describe("Summary of the suggested week"),
});

export async function runChefAgent(planId: string): Promise<ProposalInput[]> {
  const [plan, pantryItems, recipes] = await Promise.all([
    getMealPlan(planId),
    listPantryItems(),
    listRecipes({ parseStatus: "parsed" }),
  ]);

  if (!plan) throw new Error(`Meal plan ${planId} not found`);
  if (recipes.length === 0) return [];

  const model = await getModel(AGENT_ID, "text");

  const recipeList = recipes
    .map((r) => `- id: ${r.id}, title: "${r.title}"`)
    .join("\n");

  const pantryList =
    pantryItems.length > 0
      ? pantryItems
          .slice(0, 30)
          .map((i) => `- ${i.name}${i.brand ? ` (${i.brand})` : ""}${i.expiresAt ? `, expires ${i.expiresAt.toLocaleDateString()}` : ""}`)
          .join("\n")
      : "No pantry items";

  const existingSlots = plan.items
    .map((i) => {
      const d = new Date(i.date);
      const offset = ((d.getDay() + 6) % 7); // Mon=0
      return `Day ${offset} ${i.mealType}: ${i.recipe.title}`;
    })
    .join("\n");

  const object = await generateJson({
    model,
    schema: ChefOutputSchema,
    prompt: `You are a meal planning assistant. Suggest recipes for the week based on available ingredients.

Week starting: ${plan.weekStart.toLocaleDateString()}

Available recipes:
${recipeList}

Pantry items (use these up):
${pantryList}

Already planned:
${existingSlots || "None"}

Suggest ${MEAL_TYPES.length * 5} meals for Mon–Fri (skip days that are already planned).
Prioritize recipes that use pantry items that are expiring soon.
Only suggest recipes from the provided list.`,
  });

  if (object.suggestions.length === 0) return [];

  // Build a readable summary of suggestions
  const summaryLines = object.suggestions.map(
    (s) => `${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][s.dayOffset]} ${s.mealType}: ${s.recipeTitle}`
  );

  const suggestionText = summaryLines.join("\n");

  return [
    {
      agentId: AGENT_ID,
      entityType: "meal-plan",
      entityId: planId,
      patch: [
        {
          op: "add",
          path: "/suggestions",
          value: object.suggestions,
        },
      ],
      snapshot: { planId, planName: plan.name },
      rationale: object.overallRationale,
      confidence: 0.8,
      changes: [
        {
          field: "suggestions",
          before: null,
          after: suggestionText,
        },
      ],
    },
  ];
}
