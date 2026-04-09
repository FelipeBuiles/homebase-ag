import { z } from "zod";
import { getModel } from "@/lib/llm/client";
import { generateJson } from "@/lib/llm/generate-json";
import { getGroceryListItems } from "@/lib/db/queries/groceries";
import type { ProposalInput } from "./types";

const AGENT_ID = "normalization";

const NormItemSchema = z.preprocess((val) => {
  if (val && typeof val === "object") {
    const v = val as Record<string, unknown>;
    // Normalize field name variations models commonly use
    if (!v.normalizedName) {
      v.normalizedName = v.normalized_name ?? v.name ?? v.normalized ?? v.canonical;
    }
    if (v.changed === undefined) {
      v.changed = v.is_changed ?? v.wasChanged ?? true;
    }
  }
  return val;
}, z.object({
  id: z.string(),
  normalizedName: z.string(),
  changed: z.boolean(),
}));

// Models vary: raw array, { items: [] }, { results: [] }, { normalized: [] }, etc.
const NormalizationOutputSchema = z.preprocess((val) => {
  if (Array.isArray(val)) return { items: val };
  if (val && typeof val === "object") {
    // Already has items key
    if ("items" in val) return val;
    // Find first array-valued key and treat it as items
    const arr = Object.values(val as Record<string, unknown>).find(Array.isArray);
    if (arr) return { items: arr };
  }
  return val;
}, z.object({ items: z.array(NormItemSchema) }));

export async function runNormalizationAgent(listId: string): Promise<ProposalInput[]> {
  const items = await getGroceryListItems(listId);
  if (items.length === 0) return [];

  const model = await getModel(AGENT_ID, "text");

  const itemList = items
    .map((item) => `- id: ${item.id}, name: "${item.name}"`)
    .join("\n");

  const object = await generateJson({
    model,
    schema: NormalizationOutputSchema,
    prompt: `You are normalizing grocery item names for a shopping list.

For each item, produce a canonical, clean name following these rules:
- Title Case every word (e.g. "chicken breast", "olive oil")
- PRESERVE all quantities and units — never remove numbers or measurements (e.g. "3 lb Chuck Roast", "2 cans Black Beans", "1/2 cup Butter")
- Fix abbreviations and typos (e.g. "chkn" → "Chicken", "tomatoe" → "Tomato")
- Standardize word order: quantity first, adjectives second, noun last (e.g. "large eggs 12" → "12 Large Eggs")
- Keep it concise — remove filler like "some", "a few", "about"
- Do NOT remove brand names if present

Items to normalize:
${itemList}

Return one entry per item. For items that don't need changes, set changed: false and return the original name as normalizedName.`,
  });

  const proposals: ProposalInput[] = [];

  for (const result of object.items) {
    if (!result.changed) continue;

    const original = items.find((i) => i.id === result.id);
    if (!original) continue;
    if (original.normalizedName === result.normalizedName) continue;

    proposals.push({
      agentId: AGENT_ID,
      entityType: "grocery-item",
      entityId: result.id,
      patch: [{ op: "replace", path: "/normalizedName", value: result.normalizedName }],
      snapshot: { id: original.id, name: original.name, normalizedName: original.normalizedName },
      rationale: `Normalize "${original.name}" to a clean, canonical form.`,
      confidence: 0.9,
      changes: [
        {
          field: "normalizedName",
          before: original.normalizedName ?? original.name,
          after: result.normalizedName,
        },
      ],
    });
  }

  return proposals;
}
