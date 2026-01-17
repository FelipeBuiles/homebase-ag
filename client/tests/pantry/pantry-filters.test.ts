import { describe, expect, it } from "vitest";
import { filterInStockPantryItems } from "@/lib/pantry/filters";

describe("filterInStockPantryItems", () => {
  it("filters consumed items", () => {
    const result = filterInStockPantryItems([
      { id: "1", status: "in_stock" },
      { id: "2", status: "consumed" },
    ]);
    expect(result).toHaveLength(1);
  });
});
