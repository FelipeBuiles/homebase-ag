import { z } from "zod";
import { getModel } from "@/lib/llm/client";
import { generateJson } from "@/lib/llm/generate-json";
import { getInventoryItemWithAttachments } from "@/lib/db/queries/inventory";
import type { ProposalInput, FieldChange, JsonPatch } from "./types";
import { readFile } from "fs/promises";
import { join } from "path";

const AGENT_ID = "enrichment";

const EnrichmentOutputSchema = z.object({
  categories: z.array(z.string()).describe("Product categories e.g. Appliances, Electronics"),
  rooms: z.array(z.string()).describe("Rooms where this item belongs e.g. Kitchen, Living Room"),
  tags: z.array(z.string()).describe("Short descriptive tags e.g. countertop, small-appliance"),
  brand: z.string().optional().describe("Brand name if visible"),
  condition: z.enum(["good", "fair", "poor"]).optional().describe("Visible condition of the item"),
  rationale: z.string().describe("One sentence explaining the suggestions"),
  confidence: z.number().min(0).max(1).describe("Confidence in suggestions 0.0-1.0"),
});

export async function runEnrichmentAgent(itemId: string): Promise<ProposalInput> {
  const item = await getInventoryItemWithAttachments(itemId);
  if (!item) throw new Error(`Inventory item ${itemId} not found`);

  const model = await getModel(AGENT_ID, "vision");

  // Build messages — include image if available
  const messages: { role: "user"; content: ({ type: "text"; text: string } | { type: "image"; image: Uint8Array; mimeType: string }) [] }[] = [];

  const content: Array<{ type: "text"; text: string } | { type: "image"; image: Uint8Array; mimeType: string }> = [
    {
      type: "text",
      text: `You are helping categorize a household inventory item.

Item name: ${item.name}
${item.brand ? `Brand: ${item.brand}` : ""}
${item.notes ? `Notes: ${item.notes}` : ""}
Current categories: ${item.categories.join(", ") || "none"}
Current rooms: ${item.rooms.join(", ") || "none"}
Current tags: ${item.tags.join(", ") || "none"}

Suggest categories, rooms, and tags for this item. Be specific and practical.`,
    },
  ];

  // Attach first image if available
  if (item.attachments[0]) {
    try {
      const imgPath = join(process.cwd(), "public", item.attachments[0].url);
      const imgBuffer = await readFile(imgPath);
      content.push({
        type: "image",
        image: imgBuffer,
        mimeType: (item.attachments[0].mimeType || "image/jpeg") as string,
      });
    } catch {
      // Image not available locally, proceed without it
    }
  }

  messages.push({ role: "user", content });

  const output = await generateJson({
    model,
    schema: EnrichmentOutputSchema,
    messages,
  });
  const snapshot = { ...item } as Record<string, unknown>;
  const changes: FieldChange[] = [];
  const patch: JsonPatch[] = [];

  // Build changes for fields that differ
  if (output.categories.length > 0 && JSON.stringify(output.categories) !== JSON.stringify(item.categories)) {
    changes.push({ field: "categories", before: item.categories.join(", ") || null, after: output.categories.join(", ") });
    patch.push({ op: "replace", path: "/categories", value: output.categories });
  }

  if (output.rooms.length > 0 && JSON.stringify(output.rooms) !== JSON.stringify(item.rooms)) {
    changes.push({ field: "rooms", before: item.rooms.join(", ") || null, after: output.rooms.join(", ") });
    patch.push({ op: "replace", path: "/rooms", value: output.rooms });
  }

  if (output.tags.length > 0 && JSON.stringify(output.tags) !== JSON.stringify(item.tags)) {
    changes.push({ field: "tags", before: item.tags.join(", ") || null, after: output.tags.join(", ") });
    patch.push({ op: "replace", path: "/tags", value: output.tags });
  }

  if (output.brand && !item.brand) {
    changes.push({ field: "brand", before: null, after: output.brand });
    patch.push({ op: "add", path: "/brand", value: output.brand });
  }

  if (output.condition && output.condition !== item.condition) {
    changes.push({ field: "condition", before: item.condition, after: output.condition });
    patch.push({ op: "replace", path: "/condition", value: output.condition });
  }

  return {
    agentId: AGENT_ID,
    entityType: "inventory",
    entityId: itemId,
    patch,
    snapshot,
    rationale: output.rationale,
    confidence: output.confidence,
    changes,
  };
}
