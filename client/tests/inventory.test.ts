import { describe, it, expect } from "vitest";
import { isInventoryComplete, normalizeCategories, normalizeField, toTitleCase } from "../lib/inventory";

const item = (categories: string[], rooms: string[]) => ({
  name: "Sample",
  categories,
  rooms,
});

describe("inventory helpers", () => {
  it("normalizes empty fields to defaults", () => {
    expect(normalizeField("", "Unknown")).toBe("Unknown");
    expect(normalizeField("  Kitchen  ", "Unknown")).toBe("Kitchen");
  });

  it("title-cases categories", () => {
    expect(toTitleCase("living room")).toBe("Living Room");
    expect(normalizeCategories(["kitchen", "  tools "])).toEqual(["Kitchen", "Tools"]);
  });

  it("detects completeness based on categories and rooms", () => {
    expect(isInventoryComplete(item([], ["Kitchen"]))).toBe(false);
    expect(isInventoryComplete(item(["Appliances"], []))).toBe(false);
    expect(isInventoryComplete(item(["Appliances"], ["Kitchen"]))).toBe(true);
  });
});
