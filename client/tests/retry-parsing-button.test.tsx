/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../app/(protected)/recipes/actions", () => ({
  retryRecipeParsing: vi.fn().mockResolvedValue(undefined),
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

import { RetryParsingButton } from "../app/(protected)/recipes/RetryParsingButton";
import { retryRecipeParsing } from "../app/(protected)/recipes/actions";
import { toast } from "sonner";

describe("RetryParsingButton", () => {
  it("retries parsing and shows a toast", async () => {
    const user = userEvent.setup();
    render(<RetryParsingButton recipeId="recipe-1" />);

    await user.click(screen.getByRole("button", { name: /retry parsing/i }));

    expect(retryRecipeParsing).toHaveBeenCalledWith("recipe-1");
    expect(toast.success).toHaveBeenCalled();
  });
});
