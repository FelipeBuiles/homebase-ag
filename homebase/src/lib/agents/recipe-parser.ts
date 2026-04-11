import { z } from "zod";
import { getModel } from "@/lib/llm/client";
import { generateJson } from "@/lib/llm/generate-json";
import { getRecipe, updateRecipe, setRecipeIngredients } from "@/lib/db/queries/recipes";
import { prisma } from "@/lib/db/client";
import { extractRecipeImageUrl } from "@/lib/recipe-image";

const AGENT_ID = "recipe-parser";

const LooseIngredientSchema = z.object({
  raw: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  quantity: z.union([z.string(), z.number()]).optional().nullable(),
  unit: z.string().optional().nullable(),
  normalizedName: z.string().optional().nullable(),
});

const LooseRecipeOutputSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  servings: z.union([z.string(), z.number()]).optional().nullable(),
  prepMinutes: z.union([z.string(), z.number()]).optional().nullable(),
  cookMinutes: z.union([z.string(), z.number()]).optional().nullable(),
  instructions: z.string().optional().nullable().describe("Full instructions as plain text, steps separated by newlines"),
  imageUrl: z.string().optional().nullable(),
  ingredients: z.array(LooseIngredientSchema).optional().default([]),
});

function normalizeString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeQuantity(value: string | number | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeInt(value: string | number | null | undefined, options?: { min?: number }): number | undefined {
  if (value == null) return undefined;

  const numeric =
    typeof value === "number"
      ? value
      : Number.parseFloat(value.replace(/[^0-9.]+/g, ""));

  if (!Number.isFinite(numeric)) return undefined;

  const rounded = Math.round(numeric);
  if (options?.min != null && rounded < options.min) return undefined;

  return rounded;
}

function buildRawIngredient(input: {
  raw?: string | null;
  name?: string | null;
  quantity?: string | number | null;
  unit?: string | null;
}) {
  const raw = normalizeString(input.raw);
  if (raw) return raw;

  const quantity = normalizeQuantity(input.quantity);
  const unit = normalizeString(input.unit);
  const name = normalizeString(input.name);

  return [quantity, unit, name].filter(Boolean).join(" ").trim();
}

export async function runRecipeParserAgent(recipeId: string, url: string): Promise<void> {
  const existingRecipe = await getRecipe(recipeId);
  if (!existingRecipe) {
    throw new Error(`Recipe not found: ${recipeId}`);
  }

  // Mark as pending while fetching
  await updateRecipe(recipeId, { parseStatus: "pending", parsingError: null });

  // Validate URL to prevent SSRF — only allow http/https to non-private hosts
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    await updateRecipe(recipeId, { parseStatus: "failed", parsingError: "Invalid URL format" });
    throw new Error("Invalid URL format");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    await updateRecipe(recipeId, { parseStatus: "failed", parsingError: "Only HTTP(S) URLs are supported" });
    throw new Error("Only HTTP(S) URLs are supported");
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const privatePatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\./,
    /^localhost$/,
    /^::1$/,
    /^fd/,
    /^fe80:/,
    /^\[::1\]$/,
  ];
  if (privatePatterns.some((p) => p.test(hostname))) {
    await updateRecipe(recipeId, { parseStatus: "failed", parsingError: "Private/internal URLs are not allowed" });
    throw new Error("Private/internal URLs are not allowed");
  }

  let pageContent: string;
  let extractedImageUrl: string | undefined;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HomeBase/1.0)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    extractedImageUrl = normalizeString(extractRecipeImageUrl(html, url));
    // Strip tags, collapse whitespace — keep it under ~8k chars for the LLM
    pageContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateRecipe(recipeId, {
      parseStatus: "failed",
      parsingError: sanitizeError(msg),
    });
    throw new Error(`Failed to fetch recipe URL: ${err}`);
  }

  const model = await getModel(AGENT_ID, "text");

  try {
    const output = await generateJson({
      model,
      schema: LooseRecipeOutputSchema,
      messages: [
        {
          role: "user",
          content: `Extract the recipe from this webpage content.

Return a single JSON object with:
- title
- description
- servings
- prepMinutes
- cookMinutes
- instructions as plain text with steps separated by newlines
- imageUrl
- ingredients: array of objects with raw, name, quantity, unit, normalizedName

If quantity is numeric, that is acceptable. If raw is unavailable, include the best reconstructed ingredient text.

URL: ${url}

Page content:
${pageContent}`,
        },
      ],
    });

    const ingredients = output.ingredients
      .map((ingredient, index) => {
        const name = normalizeString(ingredient.name);
        const normalizedName = normalizeString(ingredient.normalizedName);
        const quantity = normalizeQuantity(ingredient.quantity);
        const unit = normalizeString(ingredient.unit);
        const raw = buildRawIngredient(ingredient);

        if (!raw && !name && !normalizedName) {
          return null;
        }

        return {
          raw: raw || name || normalizedName || `Ingredient ${index + 1}`,
          name,
          quantity,
          unit,
          normalizedName,
        };
      })
      .filter((ingredient): ingredient is NonNullable<typeof ingredient> => ingredient !== null);

    await prisma.$transaction(async () => {
      await updateRecipe(recipeId, {
        title: normalizeString(output.title) ?? existingRecipe.title,
        description: normalizeString(output.description),
        servings: normalizeInt(output.servings, { min: 1 }),
        prepMinutes: normalizeInt(output.prepMinutes, { min: 0 }),
        cookMinutes: normalizeInt(output.cookMinutes, { min: 0 }),
        instructions: normalizeString(output.instructions) ?? existingRecipe.instructions ?? "",
        imageUrl: existingRecipe.imageUrl ?? extractedImageUrl ?? normalizeString(output.imageUrl),
        parseStatus: "parsed",
        parsingError: null,
      });

      await setRecipeIngredients(recipeId, ingredients);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateRecipe(recipeId, {
      parseStatus: "failed",
      parsingError: sanitizeError(msg),
    });
    throw err;
  }
}

/** Sanitize error messages before storing in DB — strip API keys, internal URLs. */
function sanitizeError(msg: string): string {
  return msg
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_KEY]")
    .replace(/key[=:]\s*\S+/gi, "key=[REDACTED]")
    .replace(/token[=:]\s*\S+/gi, "token=[REDACTED]")
    .replace(/https?:\/\/[^\s"']+/g, (url) => {
      try { return new URL(url).hostname; } catch { return "[URL]"; }
    })
    .slice(0, 500);
}
