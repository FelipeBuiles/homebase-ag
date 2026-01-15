import { describe, it, expect } from "vitest";
import {
  isInventoryComplete,
  isInventoryEnrichmentPending,
  normalizeCategories,
  normalizeField,
  normalizeRoomName,
  normalizeTagName,
  toTitleCase,
} from "../lib/inventory";

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

  it("normalizes room and tag names", () => {
    expect(normalizeRoomName("  living room ")).toBe("Living Room");
    expect(normalizeRoomName("")).toBeNull();
    expect(normalizeTagName("  camera ")).toBe("Camera");
    expect(normalizeTagName(null)).toBeNull();
  });

  it("flags enrichment pending when attachments exist and required fields are missing", () => {
    expect(isInventoryEnrichmentPending({ attachments: [] })).toBe(false);
    expect(isInventoryEnrichmentPending({ attachments: [{}], categories: [], rooms: [] })).toBe(true);
    expect(isInventoryEnrichmentPending({ attachments: [{}], categories: ["Electronics"], rooms: [] })).toBe(true);
    expect(isInventoryEnrichmentPending({ attachments: [{}], categories: ["Electronics"], rooms: [{}] })).toBe(false);
  });
});
