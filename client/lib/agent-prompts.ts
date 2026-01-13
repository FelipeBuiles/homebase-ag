export type AgentId =
  | "agent_normalization"
  | "agent_enrichment"
  | "agent_chef"
  | "agent_expiration"
  | "agent_recipe_parser";

export type AgentPromptConfig = {
  agentId: AgentId;
  label: string;
  defaultModel: string;
  defaultPrompt: string;
};

export const AGENT_PROMPTS: AgentPromptConfig[] = [
  {
    agentId: "agent_normalization",
    label: "Grocery Normalization",
    defaultModel: "qwen3:8b",
    defaultPrompt: `You normalize grocery item names.
Return JSON only: {"normalizedName": string, "confidence": number, "rationale": string}.
Rules:
- Preserve brand if present.
- Prefer singular form.
- Title case words.
- If no change needed, return normalizedName equal to input.`,
  },
  {
    agentId: "agent_enrichment",
    label: "Inventory Enrichment",
    defaultModel: "qwen3:8b",
    defaultPrompt: `You enrich inventory items with categories.
Return JSON only: {"categories": string[], "confidence": number, "rationale": string}.
Rules:
- Choose 1-3 categories from the provided list.
- Title case categories exactly as provided.
- If unsure, return empty categories.`,
  },
  {
    agentId: "agent_chef",
    label: "Meal Plan Chef",
    defaultModel: "qwen3:8b",
    defaultPrompt: `You propose meal plan items based on expiring pantry items.
Return JSON only: {"suggestions": [{"planId": string, "date": string, "mealType": "Breakfast"|"Lunch"|"Dinner", "notes": string, "confidence": number, "rationale": string}]}.
Rules:
- Use ISO date strings.
- Prefer soonest available date.
- Avoid duplicate meal types on the same date.`,
  },
  {
    agentId: "agent_expiration",
    label: "Pantry Expiration",
    defaultModel: "qwen3:8b",
    defaultPrompt: `You decide whether an expiring pantry item should be added to groceries.
Return JSON only: {"shouldCreate": boolean, "name": string, "quantity": string, "confidence": number, "rationale": string}.
Rules:
- If item is still usable, return shouldCreate=false.
- Use a simple quantity like "1" if unsure.`,
  },
  {
    agentId: "agent_recipe_parser",
    label: "Recipe Parser",
    defaultModel: "qwen3:8b",
    defaultPrompt: `You extract structured recipe data.
Return JSON only: {"name": string, "description": string, "ingredients": string[], "instructions": string[]}.
Rules:
- If input content is missing, return empty strings/arrays.`,
  },
];
