import { describe, it, expect, vi } from "vitest";
import { updateAgentConfig } from "../app/(protected)/settings/ai-actions";
import prisma from "../lib/prisma";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("settings actions", () => {
  it("stores provider overrides", async () => {
    const data = new FormData();
    data.set("model", "llama3.1");
    data.set("providerOverride", "openrouter");
    data.set("enabled", "on");
    await updateAgentConfig("agent_enrichment", data);
    const config = await prisma.agentConfig.findUnique({ where: { agentId: "agent_enrichment" } });
    expect(config?.providerOverride).toBe("openrouter");
  });
});
