import { describe, expect, it } from "vitest";
import { getExpiringWindow } from "@/lib/pantry/queries";

const now = new Date("2026-01-01T00:00:00.000Z");

describe("getExpiringWindow", () => {
  it("returns date range for warning days", () => {
    const { start, end } = getExpiringWindow(now, 3);
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-04T00:00:00.000Z");
  });
});
