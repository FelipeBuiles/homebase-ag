/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AgentSettings } from "../app/(protected)/settings/AgentSettings";

vi.mock("../lib/prisma", () => ({
  default: {
    agentConfig: {
      findMany: vi.fn().mockResolvedValue([]),
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
