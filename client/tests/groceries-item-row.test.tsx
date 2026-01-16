// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GroceryItemRow } from "../app/(protected)/groceries/ItemRow";
import type { GroceryItem } from "@prisma/client";

vi.mock("../app/(protected)/groceries/actions", () => ({
  toggleItemCheck: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("GroceryItemRow", () => {
  it("shows normalized name as title and original below", () => {
    const item = {
      id: "1",
      name: "Green onions",
      normalizedName: "Scallions",
      canonicalKey: "scallions",
      quantity: "1",
      category: null,
      isChecked: false,
      listId: "list",
      source: "recipe",
      suggestedCategory: null,
      mergedFrom: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies GroceryItem;

    render(<GroceryItemRow item={item} />);

    expect(screen.getByText("Scallions")).toBeTruthy();
    expect(screen.getByText(/original:\s*green onions/i)).toBeTruthy();
  });
});
