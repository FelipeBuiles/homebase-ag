import { describe, expect, it } from "vitest";
import { groupPantryItemsByCategory } from "@/lib/pantry/grouping";

describe("pantry UI grouping", () => {
  it("puts uncategorized last", () => {
    const grouped = groupPantryItemsByCategory([
      { id: "1", name: "Rice", category: "Grains" },
      { id: "2", name: "Salt", category: null },
      { id: "3", name: "Tea", category: "Zeta" },
    ]);

    expect(grouped[grouped.length - 1]?.category).toBe("Uncategorized");
  });
});
