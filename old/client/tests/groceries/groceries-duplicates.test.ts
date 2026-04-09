import { describe, expect, it } from "vitest";
import { findDuplicateGroups } from "@/lib/groceries-duplicates";

describe("findDuplicateGroups", () => {
  it("groups items by canonical key", () => {
    const groups = findDuplicateGroups([
      { id: "1", name: "Milk", canonicalKey: "milk", normalizedName: "Milk" },
      { id: "2", name: "Whole milk", canonicalKey: "milk", normalizedName: "Milk" },
      { id: "3", name: "Bread", canonicalKey: "bread", normalizedName: "Bread" },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((item) => item.id)).toEqual(["1", "2"]);
  });
});
