import { describe, expect, it } from "vitest";
import { buildPantryMaintenanceInput } from "@/lib/pantry/maintenance";

describe("pantry maintenance input", () => {
  it("builds a compact summary", () => {
    const input = buildPantryMaintenanceInput([
      { id: "1", name: "Rice", status: "out_of_stock" },
    ]);
    expect(input).toContain("Rice");
  });
});
