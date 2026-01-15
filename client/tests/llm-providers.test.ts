import { describe, it, expect } from "vitest";
import { normalizeProvider, resolveProviderConfig } from "../lib/llm-providers";

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
