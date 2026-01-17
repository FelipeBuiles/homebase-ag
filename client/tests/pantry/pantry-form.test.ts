import { describe, expect, it } from "vitest";
import { buildPantryFormDefaults } from "@/components/pantry/PantryForm";

describe("pantry form defaults", () => {
  it("defaults status to in_stock", () => {
    expect(buildPantryFormDefaults(null).status).toBe("in_stock");
  });
});
