import { describe, expect, it } from "vitest";
import { deriveNameSuggestion } from "@/lib/enrichment";

describe("deriveNameSuggestion", () => {
  it("uses proposed name when not generic", () => {
    const result = deriveNameSuggestion({
      proposedName: "Sony A7",
      proposedBrand: "Sony",
      proposedModel: "A7",
      tags: ["Camera"],
    });
    expect(result.name).toBe("Sony A7");
    expect(result.usedFallback).toBe(false);
  });

  it("derives from brand/model when proposed name is generic", () => {
    const result = deriveNameSuggestion({
      proposedName: "New item",
      proposedBrand: "Sony",
      proposedModel: "A7",
      tags: ["Camera"],
    });
    expect(result.name).toBe("Sony A7");
    expect(result.usedFallback).toBe(true);
  });

  it("falls back to existing brand/model when proposed is empty", () => {
    const result = deriveNameSuggestion({
      proposedName: null,
      itemBrand: "Canon",
      itemModel: "R6",
      tags: ["Camera"],
    });
    expect(result.name).toBe("Canon R6");
    expect(result.usedFallback).toBe(true);
  });

  it("falls back to first tag when no brand/model available", () => {
    const result = deriveNameSuggestion({
      proposedName: null,
      tags: ["Camera", "Photography"],
    });
    expect(result.name).toBe("Camera");
    expect(result.usedFallback).toBe(true);
  });
});
