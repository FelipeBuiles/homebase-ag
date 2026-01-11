import { describe, it, expect } from "vitest";
import { isInventoryComplete, normalizeField } from "../lib/inventory";

const item = (category: string | null, location: string | null) => ({
  name: "Sample",
  category,
  location,
});

describe("inventory helpers", () => {
  it("normalizes empty fields to defaults", () => {
    expect(normalizeField("", "Unknown")).toBe("Unknown");
    expect(normalizeField("  Kitchen  ", "Unknown")).toBe("Kitchen");
  });

  it("detects completeness based on category and location", () => {
    expect(isInventoryComplete(item("Uncategorized", "Kitchen"))).toBe(false);
    expect(isInventoryComplete(item("Appliances", "Unknown"))).toBe(false);
    expect(isInventoryComplete(item("Appliances", "Kitchen"))).toBe(true);
  });
});
