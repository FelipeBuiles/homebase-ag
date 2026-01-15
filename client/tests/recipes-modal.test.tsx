/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../app/(protected)/recipes/actions", () => ({
  createRecipeDraft: vi.fn(),
  createRecipe: vi.fn(),
  finalizeRecipe: vi.fn(),
  updateRecipeDraft: vi.fn(),
  updateRecipe: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  createRecipeDraft,
  finalizeRecipe,
  updateRecipeDraft,
} from "../app/(protected)/recipes/actions";
import { toast } from "sonner";

import { RecipeModalForm } from "../app/(protected)/recipes/RecipeModalForm";
import { RecipeModal } from "../app/(protected)/recipes/RecipeModal";

describe("RecipeModalForm", () => {
  it("reveals manual fields when add without url is selected", async () => {
    const user = userEvent.setup();
    render(<RecipeModalForm />);

    expect(screen.queryByLabelText(/recipe name/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add without a url/i }));

    expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save recipe/i })).toBeInTheDocument();
  });

  it("enables import when a url is provided", async () => {
    const user = userEvent.setup();
    render(<RecipeModalForm />);

    expect(screen.getByRole("button", { name: /import recipe/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    expect(screen.getByRole("button", { name: /import recipe/i })).toBeEnabled();
  });

  it("calls onImport with the url", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<RecipeModalForm onImport={onImport} />);

    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(onImport).toHaveBeenCalledWith("https://example.com");
  });

  it("shows a toast when import starts", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue({ id: "recipe-1" });
    render(<RecipeModalForm onImport={onImport} />);

    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(toast.success).toHaveBeenCalled();
  });

  it("shows parsing status after import starts", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue({ id: "recipe-1" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ parsingStatus: "parsing" }),
    } as Response);
    render(<RecipeModalForm onImport={onImport} />);

    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(await screen.findByText(/parsing/i)).toBeInTheDocument();
    expect(screen.getByText(/fetch/i)).toBeInTheDocument();
    expect(screen.getByText(/parse/i)).toBeInTheDocument();
    expect(screen.getAllByText(/fill/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
  });

  it("disables form while parsing is in progress", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue({ id: "recipe-1" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ parsingStatus: "parsing" }),
    } as Response);
    render(<RecipeModalForm onImport={onImport} />);

    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(await screen.findByText(/parsing in progress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recipe name/i)).toBeDisabled();
    expect(screen.getByLabelText(/description/i)).toBeDisabled();
    expect(screen.getByLabelText(/ingredients/i)).toBeDisabled();
    expect(screen.getByLabelText(/instructions/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /save recipe/i })).toBeDisabled();
  });

  it("hydrates fields when parsing completes", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue({ id: "recipe-1" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        parsingStatus: "filled",
        name: "Quick Pho",
        description: "Fast weeknight soup",
        instructions: "Step one.\nStep two.",
        ingredients: [
          { name: "Beef", quantity: "1", unit: "lb" },
          { name: "Rice noodles", quantity: "8", unit: "oz" },
        ],
      }),
    } as Response);
    render(<RecipeModalForm onImport={onImport} />);

    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(await screen.findByDisplayValue(/quick pho/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toHaveValue("Fast weeknight soup");
    expect(screen.getByLabelText(/instructions/i)).toHaveValue("Step one.\nStep two.");
    expect(screen.getByLabelText(/ingredients/i)).toHaveValue("1 lb Beef\n8 oz Rice noodles");

    fetchSpy.mockRestore();
  });

  it("updates and finalizes the imported draft when saving", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue({ id: "recipe-1" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        parsingStatus: "filled",
        name: "Quick Pho",
        description: "Fast weeknight soup",
        instructions: "Step one.\nStep two.",
        ingredients: [
          { name: "Beef", quantity: "1", unit: "lb" },
        ],
      }),
    } as Response);
    render(<RecipeModalForm onImport={onImport} />);

    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(await screen.findByDisplayValue(/quick pho/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save recipe/i }));

    expect(updateRecipeDraft).toHaveBeenCalled();
    expect(finalizeRecipe).toHaveBeenCalledWith("recipe-1");

    const submitted = vi.mocked(updateRecipeDraft).mock.calls[0]?.[0] as FormData | undefined;
    expect(submitted?.get("recipeId")).toBe("recipe-1");
  });
});

describe("RecipeModal", () => {
  it("opens the dialog from the trigger", async () => {
    const user = userEvent.setup();
    render(<RecipeModal />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add recipe/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/recipe url/i)).toBeVisible();
  });

  it("handles import through the modal form", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<RecipeModal onImport={onImport} />);

    await user.click(screen.getByRole("button", { name: /add recipe/i }));
    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(onImport).toHaveBeenCalledWith("https://example.com");
  });

  it("uses createRecipeDraft when no handler is provided", async () => {
    const user = userEvent.setup();
    render(<RecipeModal />);

    await user.click(screen.getByRole("button", { name: /add recipe/i }));
    await user.type(screen.getByLabelText(/recipe url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /import recipe/i }));

    expect(createRecipeDraft).toHaveBeenCalledWith({ sourceUrl: "https://example.com" });
  });
});
