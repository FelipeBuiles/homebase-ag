import { describe, expect, it } from "vitest";
import { parseIngredientLine } from "@/lib/ingredients";

describe("parseIngredientLine", () => {
  it("parses quantity and unit when present", () => {
    expect(parseIngredientLine("3 ears fresh corn")).toEqual({
      quantity: "3",
      unit: "ears",
      name: "fresh corn",
    });
  });

  it("parses mixed fraction quantities", () => {
    expect(parseIngredientLine("1 1/2 cups flour")).toEqual({
      quantity: "1 1/2",
      unit: "cups",
      name: "flour",
    });
  });

  it("parses unicode fractions", () => {
    expect(parseIngredientLine("½ cup sugar")).toEqual({
      quantity: "½",
      unit: "cup",
      name: "sugar",
    });
  });

  it("keeps name intact when unit is not recognized", () => {
    expect(parseIngredientLine("1 medium onion")).toEqual({
      quantity: "1",
      unit: "",
      name: "medium onion",
    });
  });

  it("skips size parentheses before unit", () => {
    expect(parseIngredientLine("1 (14.5 oz) can tomatoes")).toEqual({
      quantity: "1",
      unit: "can",
      name: "tomatoes",
    });
  });
});
