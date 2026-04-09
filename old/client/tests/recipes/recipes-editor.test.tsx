/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(protected)/recipes/actions", () => ({
  updateRecipe: vi.fn(),
}));

import { RecipeEditor } from "@/app/(protected)/recipes/RecipeEditor";

describe("RecipeEditor", () => {
  it("enters edit mode and shows structured ingredient rows", async () => {
    const user = userEvent.setup();
    render(
      <RecipeEditor
        recipe={{
          id: "r1",
          name: "Test",
          description: "Desc",
          instructions: "Step 1",
          sourceUrl: null,
          ingredients: [
            { id: "i1", name: "Flour", quantity: "1", unit: "cup" },
          ],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/ingredient/i).length).toBe(1);
    expect(screen.getByRole("button", { name: /add ingredient/i })).toBeInTheDocument();
  });

  it("splits quantity and unit when missing", async () => {
    const user = userEvent.setup();
    render(
      <RecipeEditor
        recipe={{
          id: "r2",
          name: "Test",
          description: "Desc",
          instructions: "Step 1",
          sourceUrl: null,
          ingredients: [
            { id: "i2", name: "2 cups water", quantity: null, unit: null },
          ],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByLabelText(/quantity/i)).toHaveValue("2");
    expect(screen.getByLabelText(/unit/i)).toHaveValue("cups");
    expect(screen.getByLabelText(/ingredient/i)).toHaveValue("water");
  });

  it("shows bolded quantity and unit in the read-only ingredient list", () => {
    render(
      <RecipeEditor
        recipe={{
          id: "r3",
          name: "Test",
          description: "Desc",
          instructions: "Step 1",
          sourceUrl: null,
          ingredients: [
            { id: "i3", name: "2 cups water", quantity: null, unit: null },
          ],
        }}
      />
    );

    const quantityUnit = screen.getByText("2 cups");
    expect(quantityUnit).toHaveClass("font-semibold");
    expect(screen.getByText("water")).toBeInTheDocument();
  });
});
