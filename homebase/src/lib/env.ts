type SupportedProvider = "openrouter" | "openai" | "anthropic" | "google" | "deepseek" | "ollama";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getTrimmed(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requireVar(name: string, errors: string[]) {
  if (!getTrimmed(name)) {
    errors.push(`${name} is required`);
  }
}

function validateSessionSecret(errors: string[]) {
  const secret = getTrimmed("SESSION_SECRET");
  if (!secret) {
    errors.push("SESSION_SECRET is required");
    return;
  }

  if (secret.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters");
  }
}

function requiredKeyForProvider(provider: SupportedProvider) {
  switch (provider) {
    case "openrouter":
      return "OPENROUTER_API_KEY";
    case "openai":
      return "OPENAI_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "google":
      return "GOOGLE_GENERATIVE_AI_API_KEY";
    case "deepseek":
      return "DEEPSEEK_API_KEY";
    case "ollama":
      return null;
  }
}

function validateConfiguredProvider(errors: string[]) {
  const rawProvider = (getTrimmed("LLM_PROVIDER") ?? "openrouter") as SupportedProvider;
  const requiredKey = requiredKeyForProvider(rawProvider);
  if (requiredKey) {
    requireVar(requiredKey, errors);
  }
}

let validated = false;

export function validateServerEnv() {
  if (!isProduction() || validated) return;

  const errors: string[] = [];
  requireVar("DATABASE_URL", errors);
  validateSessionSecret(errors);
  validateConfiguredProvider(errors);

  if (errors.length > 0) {
    throw new Error(`Invalid production environment:\n- ${errors.join("\n- ")}`);
  }

  validated = true;
}

export function getRequiredEnv(name: string): string {
  const value = getTrimmed(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
