import { describe, it, expect } from "vitest";
import { getProviderClient, normalizeProvider, resolveEffectiveConfig, resolveProviderConfig } from "../lib/llm-providers";

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
    expect(resolved.baseUrl).toBeUndefined();
  });

  it("clears baseUrl for non-ollama/custom providers", () => {
    const resolved = resolveProviderConfig({
      globalProvider: "openai",
      baseUrl: "http://localhost:11434",
      apiKey: "sk-test",
      agentProviderOverride: null,
    });
    expect(resolved.baseUrl).toBeUndefined();
  });
});

describe("provider factory", () => {
  it("returns a model factory", () => {
    const client = getProviderClient({ provider: "ollama", baseUrl: "http://localhost:11434" });
    expect(typeof client).toBe("function");
  });
});

describe("effective config resolution", () => {
  it("prefers agent overrides when enabled", () => {
    const resolved = resolveEffectiveConfig({
      global: {
        provider: "openai",
        model: "gpt-4.1-mini",
        visionModel: "gpt-4.1-mini",
      },
      agent: {
        overrideEnabled: true,
        providerOverride: "openrouter",
        modelOverride: "openrouter/gpt-4o-mini",
        visionModelOverride: "openrouter/gpt-4o-mini",
      },
    });
    expect(resolved.model).toBe("openrouter/gpt-4o-mini");
    expect(resolved.provider).toBe("openrouter");
  });

  it("falls back to agent defaults when overrides are enabled but empty", () => {
    const resolved = resolveEffectiveConfig({
      global: {
        provider: "openai",
        model: "gpt-4.1-mini",
        visionModel: "gpt-4.1-mini",
      },
      agent: {
        overrideEnabled: true,
        providerOverride: "openrouter",
        modelOverride: null,
        visionModelOverride: null,
      },
      agentDefaults: {
        model: "llama3.1",
        visionModel: "llama3.1",
      },
    });
    expect(resolved.model).toBe("llama3.1");
    expect(resolved.visionModel).toBe("llama3.1");
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
