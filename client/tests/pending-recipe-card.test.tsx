/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingRecipeCard } from "../app/(protected)/recipes/PendingRecipeCard";

describe("PendingRecipeCard", () => {
  it("shows pending messaging and stepper", () => {
    render(<PendingRecipeCard parsingStatus="parsing" />);

    expect(screen.getByText(/parsing recipe/i)).toBeInTheDocument();
    expect(screen.getByText(/come back later/i)).toBeInTheDocument();
    expect(screen.getByText(/fetch/i)).toBeInTheDocument();
    expect(screen.getByText(/parse/i)).toBeInTheDocument();
    expect(screen.getAllByText(/fill/i).length).toBeGreaterThan(0);
  });
});
