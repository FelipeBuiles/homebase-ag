/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const refreshSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshSpy }),
}));

import { RecipesPolling } from "@/app/(protected)/recipes/RecipesPolling";

describe("RecipesPolling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes when parsing completes", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ parsingStatus: "filled" }),
    } as Response);

    render(<RecipesPolling pendingIds={["recipe-1"]} intervalMs={1000} />);

    await vi.runOnlyPendingTimersAsync();

    expect(refreshSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("does not refresh when there are no pending ids", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<RecipesPolling pendingIds={[]} intervalMs={1000} />);
    await vi.runOnlyPendingTimersAsync();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(refreshSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    vi.useRealTimers();
  });
});
