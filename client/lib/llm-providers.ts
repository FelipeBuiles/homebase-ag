import { createOllama } from "ai-sdk-ollama";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";

const KNOWN_PROVIDERS = [
  "ollama",
  "openai",
  "anthropic",
  "gemini",
  "deepseek",
  "openrouter",
] as const;

export type KnownProvider = (typeof KNOWN_PROVIDERS)[number];
export type ProviderKind = KnownProvider | "custom";

type ProviderConfigInput = {
  globalProvider?: string | null;
  baseUrl?: string | null;
  apiKey?: string | null;
  agentProviderOverride?: string | null;
};

type ProviderClientInput = {
  provider: ProviderKind;
  baseUrl?: string;
  apiKey?: string;
};

type EffectiveConfigInput = {
  global: {
    provider?: string | null;
    model?: string | null;
    visionModel?: string | null;
  };
  agent: {
    overrideEnabled?: boolean | null;
    providerOverride?: string | null;
    modelOverride?: string | null;
    visionModelOverride?: string | null;
  } | null;
  agentDefaults?: {
    model?: string | null;
    visionModel?: string | null;
  } | null;
};

export const normalizeProvider = (value?: string | null): ProviderKind => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "ollama";
  return (KNOWN_PROVIDERS as readonly string[]).includes(normalized)
    ? (normalized as KnownProvider)
    : "custom";
};

export const resolveProviderConfig = ({
  globalProvider,
  baseUrl,
  apiKey,
  agentProviderOverride,
}: ProviderConfigInput) => {
  const provider = normalizeProvider(agentProviderOverride || globalProvider);
  const trimmedBaseUrl = baseUrl?.trim();
  const needsBaseUrl = provider === "ollama" || provider === "custom";
  const resolvedBaseUrl = needsBaseUrl ? trimmedBaseUrl || undefined : undefined;

  return {
    provider,
    baseUrl: resolvedBaseUrl,
    apiKey: apiKey?.trim() || undefined,
  };
};

export const getProviderClient = ({ provider, baseUrl, apiKey }: ProviderClientInput) => {
  switch (provider) {
    case "ollama":
      return createOllama({ baseURL: baseUrl ?? "http://localhost:11434", apiKey });
    case "openai":
      return createOpenAI({ apiKey, baseURL: baseUrl });
    case "openrouter":
      return createOpenAI({ apiKey, baseURL: baseUrl ?? "https://openrouter.ai/api/v1" });
    case "anthropic":
      return createAnthropic({ apiKey });
    case "gemini":
      return createGoogleGenerativeAI({ apiKey });
    case "deepseek":
      return createDeepSeek({ apiKey, baseURL: baseUrl });
    case "custom":
      return createOpenAI({ apiKey, baseURL: baseUrl });
  }
};

export const resolveEffectiveConfig = ({ global, agent, agentDefaults }: EffectiveConfigInput) => {
  const shouldOverride = Boolean(agent?.overrideEnabled);
  const fallbackModel = agentDefaults?.model?.trim();
  const fallbackVisionModel = agentDefaults?.visionModel?.trim();
  const provider = shouldOverride
    ? normalizeProvider(agent?.providerOverride || global.provider)
    : normalizeProvider(global.provider);
  const model = shouldOverride
    ? agent?.modelOverride?.trim() || fallbackModel || global.model?.trim()
    : global.model?.trim();
  const visionModel = shouldOverride
    ? agent?.visionModelOverride?.trim() || fallbackVisionModel || global.visionModel?.trim()
    : global.visionModel?.trim();

  return {
    provider,
    model,
    visionModel,
  };
};
