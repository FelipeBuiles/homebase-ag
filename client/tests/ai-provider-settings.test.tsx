/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AiProviderSettings } from "../app/(protected)/settings/AiProviderSettings";

it("shows custom provider input when custom is selected", () => {
  render(<AiProviderSettings provider="custom" baseUrl="" apiKey="" />);
  const input = screen.getByLabelText(/custom provider/i);
  expect(input).toBeTruthy();
});
