import { describe, expect, it } from "vitest";
import { groupPantryItemsByCategory } from "@/lib/pantry/grouping";

describe("groupPantryItemsByCategory", () => {
  it("groups by category with fallback", () => {
    const grouped = groupPantryItemsByCategory([
      { id: "1", name: "Rice", category: "Grains" },
      { id: "2", name: "Salt", category: null },
    ]);

    expect(grouped[0].category).toBe("Grains");
    expect(grouped[1].category).toBe("Uncategorized");
  });
});
