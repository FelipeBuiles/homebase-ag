import { describe, expect, it } from "vitest";
import { getEffectiveExpirationDate, getExpirationStatus } from "@/lib/pantry/expiration";

const today = new Date("2026-01-01T00:00:00.000Z");

describe("pantry expiration helpers", () => {
  it("prefers opened date when provided", () => {
    const expiration = new Date("2026-01-10T00:00:00.000Z");
    const opened = new Date("2025-12-28T00:00:00.000Z");
    expect(getEffectiveExpirationDate(expiration, opened)?.toISOString()).toBe(opened.toISOString());
  });

  it("returns expiring soon status", () => {
    const expiration = new Date("2026-01-03T00:00:00.000Z");
    const status = getExpirationStatus(expiration, today, 3);
    expect(status.label).toBe("Expiring Soon");
    expect(status.level).toBe("warning");
  });
});
