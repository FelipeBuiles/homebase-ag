import { generateText } from "ai";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AGENT_PROMPTS, type AgentId } from "@/lib/agent-prompts";
import { getProviderClient, resolveEffectiveConfig, resolveProviderConfig } from "@/lib/llm-providers";

const getPromptConfig = (agentId: AgentId) =>
  AGENT_PROMPTS.find((agent) => agent.agentId === agentId);

const extractJson = (input: string) => {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = input.slice(start, end + 1);
  try {
    return JSON.parse(slice) as unknown;
  } catch {
    return null;
  }
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const parseAgentResponse = (agentId: AgentId, raw: string) => {
  const data = extractJson(raw);
  if (!data || typeof data !== "object") return null;

  switch (agentId) {
    case "agent_normalization": {
      const normalizedName = typeof (data as { normalizedName?: unknown }).normalizedName === "string"
        ? (data as { normalizedName: string }).normalizedName
        : null;
      if (!normalizedName) return null;
      const confidence = typeof (data as { confidence?: unknown }).confidence === "number"
        ? (data as { confidence: number }).confidence
        : undefined;
      const rationale = typeof (data as { rationale?: unknown }).rationale === "string"
        ? (data as { rationale: string }).rationale
        : undefined;
      return { normalizedName, confidence, rationale };
    }
    case "agent_enrichment": {
      const categories = (data as { categories?: unknown }).categories;
      const rooms = (data as { rooms?: unknown }).rooms;
      const tags = (data as { tags?: unknown }).tags;
      if (!isStringArray(categories) || !isStringArray(rooms) || !isStringArray(tags)) return null;

      const name = typeof (data as { name?: unknown }).name === "string"
        ? (data as { name: string }).name
        : null;
      const brand = typeof (data as { brand?: unknown }).brand === "string"
        ? (data as { brand: string }).brand
        : null;
      const model = typeof (data as { model?: unknown }).model === "string"
        ? (data as { model: string }).model
        : null;
      const condition = typeof (data as { condition?: unknown }).condition === "string"
        ? (data as { condition: string }).condition
        : null;
      const serial = typeof (data as { serial?: unknown }).serial === "string"
        ? (data as { serial: string }).serial
        : null;

      const confidenceByField = isRecord((data as { confidenceByField?: unknown }).confidenceByField)
        ? (data as { confidenceByField: Record<string, unknown> }).confidenceByField
        : undefined;
      const rationaleByField = isRecord((data as { rationaleByField?: unknown }).rationaleByField)
        ? (data as { rationaleByField: Record<string, unknown> }).rationaleByField
        : undefined;

      return {
        categories,
        rooms,
        tags,
        name,
        brand,
        model,
        condition,
        serial,
        confidenceByField,
        rationaleByField,
      };
    }
    case "agent_expiration": {
      const shouldCreate = (data as { shouldCreate?: unknown }).shouldCreate;
      if (typeof shouldCreate !== "boolean") return null;
      const name = typeof (data as { name?: unknown }).name === "string"
        ? (data as { name: string }).name
        : undefined;
      const quantity = typeof (data as { quantity?: unknown }).quantity === "string"
        ? (data as { quantity: string }).quantity
        : undefined;
      const confidence = typeof (data as { confidence?: unknown }).confidence === "number"
        ? (data as { confidence: number }).confidence
        : undefined;
      const rationale = typeof (data as { rationale?: unknown }).rationale === "string"
        ? (data as { rationale: string }).rationale
        : undefined;
      return { shouldCreate, name, quantity, confidence, rationale };
    }
    case "agent_chef": {
      const suggestions = (data as { suggestions?: unknown }).suggestions;
      if (!Array.isArray(suggestions)) return null;
      const normalized = suggestions
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
          planId: typeof (entry as { planId?: unknown }).planId === "string"
            ? (entry as { planId: string }).planId
            : null,
          date: typeof (entry as { date?: unknown }).date === "string"
            ? (entry as { date: string }).date
            : null,
          mealType: typeof (entry as { mealType?: unknown }).mealType === "string"
            ? (entry as { mealType: string }).mealType
            : null,
          notes: typeof (entry as { notes?: unknown }).notes === "string"
            ? (entry as { notes: string }).notes
            : undefined,
          confidence: typeof (entry as { confidence?: unknown }).confidence === "number"
            ? (entry as { confidence: number }).confidence
            : undefined,
          rationale: typeof (entry as { rationale?: unknown }).rationale === "string"
            ? (entry as { rationale: string }).rationale
            : undefined,
        }))
        .filter((entry) => entry.planId && entry.date && entry.mealType);

      return { suggestions: normalized };
    }
    case "agent_pantry_maintenance": {
      const actions = (data as { actions?: unknown }).actions;
      if (!Array.isArray(actions)) return null;
      const normalized = actions
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
          type: typeof (entry as { type?: unknown }).type === "string"
            ? (entry as { type: string }).type
            : null,
          pantryItemId: typeof (entry as { pantryItemId?: unknown }).pantryItemId === "string"
            ? (entry as { pantryItemId: string }).pantryItemId
            : null,
          status: typeof (entry as { status?: unknown }).status === "string"
            ? (entry as { status: string }).status
            : null,
          confidence: typeof (entry as { confidence?: unknown }).confidence === "number"
            ? (entry as { confidence: number }).confidence
            : undefined,
          rationale: typeof (entry as { rationale?: unknown }).rationale === "string"
            ? (entry as { rationale: string }).rationale
            : undefined,
        }))
        .filter((entry) => entry.type && entry.pantryItemId && entry.status);

      return { actions: normalized };
    }
    case "agent_recipe_parser": {
      const name = typeof (data as { name?: unknown }).name === "string"
        ? (data as { name: string }).name
        : null;
      const description = typeof (data as { description?: unknown }).description === "string"
        ? (data as { description: string }).description
        : "";
      const ingredients = (data as { ingredients?: unknown }).ingredients;
      const instructions = (data as { instructions?: unknown }).instructions;
      if (!name || !isStringArray(ingredients) || !isStringArray(instructions)) return null;
      return { name, description, ingredients, instructions };
    }
    default:
      return null;
  }
};

export const getAgentConfig = async (agentId: AgentId) => {
  const fallback = getPromptConfig(agentId);
  const stored = await prisma.agentConfig.findUnique({ where: { agentId } });
  if (stored) return stored;
  if (!fallback) return null;

  return prisma.agentConfig.create({
    data: {
      agentId: fallback.agentId,
      model: fallback.defaultModel,
      visionModel: fallback.defaultVisionModel ?? fallback.defaultModel,
      prompt: fallback.defaultPrompt,
      systemPrompt: fallback.defaultPrompt,
      userPrompt: "",
      enabled: true,
    },
  });
};

export const runAgentPrompt = async (agentId: AgentId, input: string) => {
  const config = await getAgentConfig(agentId);
  if (!config || !config.enabled) {
    return { data: null, raw: "" };
  }

  const appConfig = await prisma.appConfig.findFirst();
  const effectiveConfig = resolveEffectiveConfig({
    global: {
      provider: appConfig?.llmProvider,
      model: appConfig?.llmModel,
      visionModel: appConfig?.llmVisionModel,
    },
    agent: config
      ? {
          overrideEnabled: config.overrideEnabled,
          providerOverride: config.providerOverride,
          modelOverride: config.modelOverride,
          visionModelOverride: config.visionModelOverride,
        }
      : null,
    agentDefaults: {
      model: config?.model,
      visionModel: config?.visionModel,
    },
  });
  const modelName =
    effectiveConfig.model || config.model || getPromptConfig(agentId)?.defaultModel || "llama3.1";
  const { provider, baseUrl, apiKey } = resolveProviderConfig({
    globalProvider: effectiveConfig.provider,
    baseUrl: appConfig?.llmBaseUrl,
    apiKey: appConfig?.llmApiKey,
    agentProviderOverride: null,
  });
  const providerClient = getProviderClient({ provider, baseUrl, apiKey });
  const truncate = (value: string, limit = 600) =>
    value.length > limit ? `${value.slice(0, limit)}…` : value;
  const toJsonValue = (value: unknown): Prisma.InputJsonValue | null => {
    if (value === null) return null;
    const valueType = typeof value;
    if (valueType === "string" || valueType === "number" || valueType === "boolean") {
      return value as Prisma.InputJsonValue;
    }
    if (Array.isArray(value) || valueType === "object") {
      return value as Prisma.InputJsonValue;
    }
    return null;
  };

  const basePrompt =
    config.systemPrompt ||
    config.prompt ||
    getPromptConfig(agentId)?.defaultPrompt ||
    "";
  const userPrompt = config.userPrompt?.trim();
  const combinedPrompt = userPrompt
    ? `${basePrompt}\n\nUSER INSTRUCTIONS:\n${userPrompt}`
    : basePrompt;
  const prompt = `${combinedPrompt}\n\nINPUT:\n${input}`;
  const start = Date.now();
  try {
    const response = await generateText({
      model: providerClient(modelName),
      prompt,
    });

    const raw = response.text ?? "";
    const data = parseAgentResponse(agentId, raw);
    const toolCalls = (response as { toolCalls?: unknown[] }).toolCalls;
    const usage = (response as { usage?: unknown }).usage;
    const usageValue = toJsonValue(usage);
    const durationMs = Date.now() - start;

    await prisma.auditLog.create({
      data: {
        action: "agent.run",
        details: {
          agentId,
          model: modelName,
          summary: `${agentId} ran with ${modelName}`,
          input: truncate(input),
          prompt: truncate(config.prompt),
          response: truncate(raw),
          request: {
            provider,
            baseURL: baseUrl,
            model: modelName,
            prompt,
          },
          responseRaw: raw,
          success: Boolean(data),
          durationMs,
          promptChars: prompt.length,
          responseChars: raw.length,
          functionCalls: Array.isArray(toolCalls) ? toolCalls.length : 0,
          usage: usageValue,
        },
      },
    });

    return { data, raw };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const durationMs = Date.now() - start;
    await prisma.auditLog.create({
      data: {
        action: "agent.run.failed",
        details: {
          agentId,
          model: modelName,
          summary: `${agentId} failed with ${modelName}`,
          input: truncate(input),
          prompt: truncate(config.prompt),
          error: message,
          request: {
            provider,
            baseURL: baseUrl,
            model: modelName,
            prompt,
          },
          durationMs,
          promptChars: prompt.length,
          functionCalls: 0,
        },
      },
    });
    throw error;
  }
};
