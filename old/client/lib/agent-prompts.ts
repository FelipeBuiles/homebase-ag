export type AgentId =
  | "agent_normalization"
  | "agent_enrichment"
  | "agent_chef"
  | "agent_expiration"
  | "agent_pantry_maintenance"
  | "agent_recipe_parser";

export type AgentPromptConfig = {
  agentId: AgentId;
  label: string;
  defaultModel: string;
  defaultVisionModel?: string;
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
    defaultVisionModel: "qwen3-vl:8b",
    defaultPrompt: `You enrich inventory items with structured metadata and suggestions.
Return JSON only, no markdown.
Schema:
{
  "name": string | null,
  "brand": string | null,
  "model": string | null,
  "condition": "New"|"Like New"|"Good"|"Fair"|"Poor"|null,
  "categories": string[],
  "rooms": string[],
  "tags": string[],
  "serial": string | null,
  "confidenceByField": {
    "name"?: number,
    "brand"?: number,
    "model"?: number,
    "condition"?: number,
    "categories"?: number,
    "rooms"?: number,
    "tags"?: number,
    "serial"?: number
  },
  "rationaleByField": {
    "name"?: string,
    "brand"?: string,
    "model"?: string,
    "condition"?: string,
    "categories"?: string,
    "rooms"?: string,
    "tags"?: string,
    "serial"?: string
  }
}
Rules:
- Only choose categories and rooms from the provided lists.
- Tags must be concise (1-2 words, Title Case).
- If uncertain, return empty arrays for categories/rooms/tags and null for strings.
- If the item name is generic (e.g., "New item"), do not repeat it. Return null unless you can infer a better name from VISUAL labels/OCR.
- Confidence is 0.0-1.0. Use <0.6 when uncertain.`,
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
    agentId: "agent_pantry_maintenance",
    label: "Pantry Maintenance",
    defaultModel: "qwen3:8b",
    defaultPrompt: `You suggest pantry maintenance actions.
Return JSON only: {"actions":[{"type":"mark","pantryItemId":string,"status":"out_of_stock"|"discarded","confidence":number,"rationale":string}]}.
Rules:
- Only return actions when confidence is high.
- Prefer marking out_of_stock for stale items.`,
  },
  {
    agentId: "agent_recipe_parser",
    label: "Recipe Parser",
    defaultModel: "qwen3:8b",
    defaultVisionModel: "qwen3:8b",
    defaultPrompt: `You extract structured recipe data.
You must respond with ONLY a raw JSON object, nothing else.
Do not include markdown, code fences, explanations, or extra keys.
Your entire response must be a single JSON object in this exact shape:
{"name": "string", "description": "string", "ingredients": ["string"], "instructions": ["string"]}.
Rules:
- If input content is missing, return empty strings/arrays.`,
  },
];
