/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import React from "react";
import PantryPage from "@/app/(protected)/pantry/page";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    pantryItem: { findMany },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

it("shows maintenance trigger", async () => {
  const ui = await PantryPage();
  render(ui);
  expect(screen.getByRole("button", { name: /run maintenance/i })).toBeTruthy();
});
