// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { it, vi, expect } from "vitest";
import RecipeDetailPage from "../app/(protected)/recipes/[id]/page";

vi.mock("../app/(protected)/recipes/actions", () => ({
  deleteRecipe: vi.fn(),
}));

vi.mock("../app/(protected)/recipes/AddToGroceriesButton", () => ({
  AddToGroceriesButton: () => <button>Add to groceries</button>,
}));

vi.mock("../lib/prisma", () => ({
  default: {
    recipe: {
      findUnique: vi.fn(async () => ({
        id: "r1",
        name: "Soup",
        status: "ready",
        parsingStatus: "filled",
        ingredients: [],
      })),
    },
  },
}));

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

it("renders add to groceries action", async () => {
  render(await RecipeDetailPage({ params: Promise.resolve({ id: "r1" }) }));
  expect(screen.getByRole("button", { name: /add to groceries/i })).toBeTruthy();
});
