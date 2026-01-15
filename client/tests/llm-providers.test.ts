import { describe, it, expect } from "vitest";
import { getProviderClient, normalizeProvider, resolveProviderConfig } from "../lib/llm-providers";

describe("llm provider resolution", () => {
  it("normalizes known providers", () => {
    expect(normalizeProvider(" OpenAI ")).toBe("openai");
    expect(normalizeProvider("Anthropic")).toBe("anthropic");
    expect(normalizeProvider("OpenRouter")).toBe("openrouter");
  });

  it("treats unknown providers as custom", () => {
    expect(normalizeProvider("my-gateway")).toBe("custom");
  });

  it("resolves effective provider config", () => {
    const resolved = resolveProviderConfig({
      globalProvider: "openai",
      baseUrl: "",
      apiKey: "sk-test",
      agentProviderOverride: "openrouter",
    });
    expect(resolved.provider).toBe("openrouter");
    expect(resolved.baseUrl).toBe("https://openrouter.ai/api/v1");
  });
});

describe("provider factory", () => {
  it("returns a model factory", () => {
    const client = getProviderClient({ provider: "ollama", baseUrl: "http://localhost:11434" });
    expect(typeof client).toBe("function");
  });
});

describe("agent config selection", () => {
  it("prefers agent override provider", () => {
    const resolved = resolveProviderConfig({
      globalProvider: "ollama",
      baseUrl: "http://localhost:11434",
      apiKey: null,
      agentProviderOverride: "openai",
    });
    expect(resolved.provider).toBe("openai");
  });
});
