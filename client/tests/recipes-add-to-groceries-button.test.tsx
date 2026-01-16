// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddToGroceriesButton } from "../app/(protected)/recipes/AddToGroceriesButton";

vi.mock("../app/(protected)/recipes/actions", () => ({
  addRecipeIngredientsToGroceriesAction: vi.fn(),
}));

describe("AddToGroceriesButton", () => {
  it("renders the add button", () => {
    render(<AddToGroceriesButton recipeId="abc" />);
    expect(screen.getByRole("button", { name: /add to groceries/i })).toBeTruthy();
  });
});
