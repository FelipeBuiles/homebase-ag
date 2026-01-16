import { describe, it, expect, vi } from "vitest";
import { updateAgentConfig, updateAiProvider } from "../app/(protected)/settings/ai-actions";
import prisma from "../lib/prisma";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("settings actions", () => {
  it("stores global model overrides and agent overrides", async () => {
    const global = new FormData();
    global.set("provider", "openai");
    global.set("model", "gpt-4.1-mini");
    global.set("visionModel", "gpt-4.1-mini");
    await updateAiProvider(global);
    const app = await prisma.appConfig.findFirst();
    expect(app?.llmModel).toBe("gpt-4.1-mini");

    const agent = new FormData();
    agent.set("overrideEnabled", "on");
    agent.set("providerOverride", "openrouter");
    agent.set("modelOverride", "openrouter/gpt-4o-mini");
    agent.set("visionModelOverride", "openrouter/gpt-4o-mini");
    await updateAgentConfig("agent_enrichment", agent);
    const config = await prisma.agentConfig.findUnique({ where: { agentId: "agent_enrichment" } });
    expect(config?.overrideEnabled).toBe(true);
  });

  it("clears base url for non-local providers", async () => {
    const form = new FormData();
    form.set("provider", "openai");
    form.set("baseUrl", "http://localhost:11434");
    await updateAiProvider(form);
    const app = await prisma.appConfig.findFirst();
    expect(app?.llmBaseUrl).toBeNull();
  });
});
