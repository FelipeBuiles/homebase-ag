import { describe, expect, it } from "vitest";
import { AGENT_PROMPTS } from "@/lib/agent-prompts";

describe("agent_recipe_parser prompt", () => {
  it("requires strict JSON output with an example", () => {
    const prompt = AGENT_PROMPTS.find((agent) => agent.agentId === "agent_recipe_parser")
      ?.defaultPrompt ?? "";

    expect(prompt).toMatch(/only a raw json object/i);
    expect(prompt).toMatch(/do not include markdown/i);
    expect(prompt).toMatch(/\{"name":\s*".*?",\s*"description":/);
  });
});
