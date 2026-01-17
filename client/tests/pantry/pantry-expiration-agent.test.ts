import { describe, expect, it } from "vitest";
import { buildExpiringPantryWhere } from "@/lib/pantry/expiration-agent";

const now = new Date("2026-01-01T00:00:00.000Z");

describe("buildExpiringPantryWhere", () => {
  it("filters by in-stock status and warning window", () => {
    const where = buildExpiringPantryWhere(now, 7);
    const expiration = where.expirationDate as { lte: Date; gte: Date };

    expect(where.status).toBe("in_stock");
    expect(expiration.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(expiration.lte.toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });
});
