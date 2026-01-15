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
  const resolvedBaseUrl = trimmedBaseUrl
    ? trimmedBaseUrl
    : provider === "openrouter"
      ? "https://openrouter.ai/api/v1"
      : undefined;

  return {
    provider,
    baseUrl: resolvedBaseUrl,
    apiKey: apiKey?.trim() || undefined,
  };
};
