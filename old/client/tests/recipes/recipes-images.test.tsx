/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma", () => ({
  default: {
    recipe: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/app/(protected)/recipes/RecipeModal", () => ({
  RecipeModal: () => <div data-testid="recipe-modal" />,
}));

vi.mock("@/app/(protected)/recipes/RecipesPolling", () => ({
  RecipesPolling: () => null,
}));

vi.mock("@/app/(protected)/recipes/PendingRecipeCard", () => ({
  PendingRecipeCard: () => null,
}));

vi.mock("@/app/(protected)/recipes/RetryParsingButton", () => ({
  RetryParsingButton: () => null,
}));

vi.mock("@/app/(protected)/recipes/actions", () => ({
  deleteRecipe: vi.fn(),
}));

import prisma from "@/lib/prisma";
import RecipesPage from "@/app/(protected)/recipes/page";
import RecipeDetailPage from "@/app/(protected)/recipes/[id]/page";

describe("recipe images", () => {
  it("renders recipe images in list and detail views", async () => {
    vi.mocked(prisma.recipe.findMany).mockResolvedValue([
      {
        id: "r1",
        name: "Image Recipe",
        description: "Desc",
        status: "ready",
        parsingStatus: "filled",
        imageUrl: "https://example.com/recipe.jpg",
        _count: { ingredients: 3 },
      },
    ]);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValue({
      id: "r1",
      name: "Image Recipe",
      description: "Desc",
      instructions: "Cook",
      sourceUrl: null,
      status: "ready",
      parsingStatus: "filled",
      parsingError: null,
      parsingUpdatedAt: null,
      imageUrl: "https://example.com/recipe.jpg",
      ingredients: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const listView = await RecipesPage({ searchParams: Promise.resolve({}) });
    render(listView);

    expect(screen.getByAltText("Image Recipe image")).toHaveAttribute(
      "src",
      "https://example.com/recipe.jpg"
    );

    const detailView = await RecipeDetailPage({ params: Promise.resolve({ id: "r1" }) });
    render(detailView);

    expect(screen.getAllByAltText("Image Recipe image").length).toBeGreaterThan(1);
  });
});
