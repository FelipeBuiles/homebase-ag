/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AgentSettings } from "../app/(protected)/settings/AgentSettings";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/prisma", () => ({
  default: {
    agentConfig: {
      findMany,
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

it("hides override fields until enabled", async () => {
  const ui = await AgentSettings();
  render(ui);
  expect(screen.queryByLabelText(/override provider/i)).toBeNull();
});

it("shows override fields when enabled", async () => {
  findMany.mockResolvedValueOnce([
    {
      agentId: "agent_enrichment",
      model: "llama3.1",
      visionModel: "llama3.1",
      prompt: "",
      systemPrompt: "",
      userPrompt: "",
      enabled: true,
      overrideEnabled: true,
      providerOverride: null,
      modelOverride: null,
      visionModelOverride: null,
    },
  ]);
  const ui = await AgentSettings();
  render(ui);
  expect(screen.getByText(/override provider/i)).toBeTruthy();
});
