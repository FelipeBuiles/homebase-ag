import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

describe("resetDb", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("clears data between tests", async () => {
    await prisma.room.create({ data: { name: "Kitchen" } });
    const count = await prisma.room.count();
    expect(count).toBe(1);
    await resetDb();
    const nextCount = await prisma.room.count();
    expect(nextCount).toBe(0);
  });

  it("supports provider overrides", async () => {
    const config = await prisma.agentConfig.create({
      data: {
        agentId: "agent_enrichment",
        model: "llama3.1",
        visionModel: "llama3.1",
        prompt: "x",
        systemPrompt: "x",
        userPrompt: "",
        providerOverride: "openrouter",
        enabled: true,
      },
    });
    expect(config.providerOverride).toBe("openrouter");
  });

  it("stores global and agent override flags", async () => {
    const app = await prisma.appConfig.create({
      data: {
        id: "app",
        setupComplete: true,
        llmProvider: "openai",
        llmModel: "gpt-4.1-mini",
        llmVisionModel: "gpt-4.1-mini",
      },
    });
    expect(app.llmModel).toBe("gpt-4.1-mini");

    const agent = await prisma.agentConfig.create({
      data: {
        agentId: "agent_enrichment",
        model: "llama3.1",
        visionModel: "llama3.1",
        prompt: "x",
        systemPrompt: "x",
        userPrompt: "",
        providerOverride: "openrouter",
        modelOverride: "openrouter/gpt-4o-mini",
        visionModelOverride: "openrouter/gpt-4o-mini",
        overrideEnabled: true,
        enabled: true,
      },
    });
    expect(agent.overrideEnabled).toBe(true);
  });
});
