/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import React from "react";
import PantryExpiringPage from "@/app/(protected)/pantry/expiring/page";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    pantryItem: { findMany },
  },
}));

vi.mock("@/lib/settings", () => ({
  getAppConfig: vi.fn().mockResolvedValue({ pantryWarningDays: 7 }),
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

it("renders warning window section", async () => {
  const ui = await PantryExpiringPage({ searchParams: {} });
  render(ui);
  expect(screen.getAllByText(/warning window/i).length).toBeGreaterThan(0);
});
