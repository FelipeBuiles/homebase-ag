// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QuickActions } from "../app/(protected)/groceries/QuickActions";

describe("QuickActions", () => {
  it("renders clear buttons and filters", () => {
    render(
      <QuickActions
        items={[]}
        filters={{ status: "all", source: "all" }}
        onFilterChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /clear checked/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /clear all/i })).toBeTruthy();
    expect(screen.getAllByText(/remaining/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/checked/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/source/i)).toBeTruthy();
  });
});
