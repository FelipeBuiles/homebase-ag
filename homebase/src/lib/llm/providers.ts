import { prisma } from "@/lib/db/client";

export type LLMProvider = "openrouter" | "openai" | "anthropic" | "google" | "deepseek" | "ollama";
export type ModelCapability = "text" | "vision";

/**
 * Returns a model instance for the given agent + capability.
 *
 * Resolution order:
 * 1. AgentConfig.llmOverride + AgentConfig.modelOverride (if set)
 * 2. AppConfig.llmProvider + AppConfig.textModel / AppConfig.visionModel (DB settings page)
 * 3. LLM_PROVIDER / DEFAULT_TEXT_MODEL / DEFAULT_VISION_MODEL env vars
 * 4. Hardcoded defaults (openrouter + gemini-2.0-flash)
 */
export async function getModel(agentId?: string, capability: ModelCapability = "text") {
  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  const agentConfig = agentId
    ? await prisma.agentConfig.findUnique({ where: { agentId } })
    : null;

  const provider = (
    agentConfig?.llmOverride ??
    process.env.LLM_PROVIDER ??
    config?.llmProvider ??
    "openrouter"
  ) as LLMProvider;

  const envModel =
    capability === "vision"
      ? process.env.DEFAULT_VISION_MODEL
      : process.env.DEFAULT_TEXT_MODEL;

  const dbModel =
    capability === "vision" ? config?.visionModel : config?.textModel;

  // Resolution: per-agent override > DB/UI setting > env var > hardcoded default
  const model =
    agentConfig?.modelOverride ?? dbModel ?? envModel ?? "google/gemini-2.0-flash-001";

  console.log(`[llm] provider=${provider} model=${model} agent=${agentId ?? "global"} capability=${capability}`);

  return buildModel(provider, model, config);
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Set it in .env.local and restart the server.`
    );
  }
  return value;
}

async function buildModel(
  provider: LLMProvider,
  model: string,
  config: { ollamaBaseUrl: string; ollamaModel: string } | null
) {
  switch (provider) {
    case "openrouter": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: requireEnv("OPENROUTER_API_KEY"),
        headers: {
          "HTTP-Referer": "https://homebase.local",
          "X-Title": "HomeBase",
        },
      });
      return openrouter(model);
    }
    case "openai": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      return createOpenAI({ apiKey: requireEnv("OPENAI_API_KEY") })(model);
    }
    case "anthropic": {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      return createAnthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") })(model);
    }
    case "google": {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      return createGoogleGenerativeAI({ apiKey: requireEnv("GOOGLE_GENERATIVE_AI_API_KEY") })(model);
    }
    case "deepseek": {
      const { createDeepSeek } = await import("@ai-sdk/deepseek");
      return createDeepSeek({ apiKey: requireEnv("DEEPSEEK_API_KEY") })(model);
    }
    case "ollama": {
      const { createOllama } = await import("ai-sdk-ollama");
      const ollama = createOllama({
        baseURL: config?.ollamaBaseUrl ?? "http://localhost:11434/api",
      });
      return ollama(model);
    }
    default: {
      throw new Error(`Unknown LLM provider: "${provider}". Valid options: openrouter, openai, anthropic, google, deepseek, ollama`);
    }
  }
}
