/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AiProviderSettings } from "@/app/(protected)/settings/AiProviderSettings";

it("shows custom provider input when custom is selected", () => {
  render(<AiProviderSettings provider="custom" baseUrl="" apiKey="" />);
  const input = screen.getByLabelText(/custom provider/i);
  expect(input).toBeTruthy();
});

it("renders global model overrides", () => {
  render(<AiProviderSettings provider="openai" baseUrl="" apiKey="" />);
  expect(screen.getByLabelText(/global model/i)).toBeTruthy();
  expect(screen.getByLabelText(/global vision model/i)).toBeTruthy();
});

it("does not default base url for non-local providers", () => {
  render(<AiProviderSettings provider="openai" baseUrl={null} apiKey="" />);
  const input = screen.getByPlaceholderText("http://localhost:11434") as HTMLInputElement;
  expect(input.value).toBe("");
});
