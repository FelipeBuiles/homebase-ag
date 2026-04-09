import { generateText } from "ai";
import type { z } from "zod";
import type { LanguageModel } from "ai";

/**
 * Generates a structured object from a model using generateText + JSON parsing.
 * Works with any model regardless of whether it supports tool calling / structured output.
 *
 * Falls back gracefully: the model is asked to respond with JSON only. Any markdown
 * code fences are stripped before parsing.
 */
export async function generateJson<T>(options: {
  model: LanguageModel;
  schema: z.ZodType<T>;
  prompt?: string;
  system?: string;
  messages?: Parameters<typeof generateText>[0]["messages"];
}): Promise<T> {
  const { model, schema, prompt, messages } = options;

  const systemInstruction = [
    options.system,
    "Respond with a single JSON object that matches the requested structure. No markdown, no explanation, no code fences — only raw JSON.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const textOptions = messages
    ? { model, system: systemInstruction, messages }
    : { model, system: systemInstruction, prompt: prompt ?? "" };

  const result = await generateText(textOptions as Parameters<typeof generateText>[0]);

  const raw = result.text.trim();

  // Strip markdown code fences if present
  const jsonText = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // If the model returned non-JSON text, try to extract a JSON object/array
    const match = jsonText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) {
      throw new Error(`Model did not return valid JSON.\n\nRaw response:\n${raw.slice(0, 500)}`);
    }
    parsed = JSON.parse(match[1]);
  }

  console.log(`[llm] raw parsed:`, JSON.stringify(parsed).slice(0, 300));

  return schema.parse(parsed);
}
