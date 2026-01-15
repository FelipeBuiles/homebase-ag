import { afterEach, describe, expect, it, vi } from "vitest";
import { createCountSseStream } from "../lib/sse";

describe("createCountSseStream", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stops polling after the signal aborts", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    let calls = 0;

    const stream = createCountSseStream({
      signal: controller.signal,
      intervalMs: 1000,
      getCount: async () => {
        calls += 1;
        return calls;
      },
    });

    const reader = stream.getReader();
    await reader.read();

    await vi.advanceTimersByTimeAsync(3000);
    const callsBeforeAbort = calls;
    expect(callsBeforeAbort).toBeGreaterThan(0);

    controller.abort();
    await vi.advanceTimersByTimeAsync(3000);

    expect(calls).toBe(callsBeforeAbort);
    await reader.cancel();
  });
});
