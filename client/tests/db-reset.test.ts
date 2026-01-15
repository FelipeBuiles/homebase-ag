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
});
