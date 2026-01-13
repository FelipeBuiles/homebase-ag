import { describe, it, expect } from "vitest";
import { parseAgentResponse } from "../lib/ai";

describe("parseAgentResponse", () => {
  it("parses normalization payload", () => {
    const raw = `{"normalizedName":"Green Apple","confidence":0.8,"rationale":"Title case"}`;
    const result = parseAgentResponse("agent_normalization", raw);
    expect(result).toEqual({
      normalizedName: "Green Apple",
      confidence: 0.8,
      rationale: "Title case",
    });
  });

  it("rejects malformed normalization payload", () => {
    const raw = `{"name":"Green Apple"}`;
    const result = parseAgentResponse("agent_normalization", raw);
    expect(result).toBeNull();
  });

  it("parses enrichment payload", () => {
    const raw = `{"categories":["Kitchen","Tools"],"confidence":0.7}`;
    const result = parseAgentResponse("agent_enrichment", raw);
    expect(result).toEqual({
      categories: ["Kitchen", "Tools"],
      confidence: 0.7,
      rationale: undefined,
    });
  });

  it("parses expiration payload", () => {
    const raw = `{"shouldCreate":true,"name":"Milk","quantity":"1","confidence":0.6}`;
    const result = parseAgentResponse("agent_expiration", raw);
    expect(result).toEqual({
      shouldCreate: true,
      name: "Milk",
      quantity: "1",
      confidence: 0.6,
      rationale: undefined,
    });
  });

  it("parses chef suggestions payload", () => {
    const raw = `{"suggestions":[{"planId":"plan-1","date":"2024-01-01T00:00:00.000Z","mealType":"Dinner","notes":"Use eggs","confidence":0.7}]}`;
    const result = parseAgentResponse("agent_chef", raw);
    expect(result).toEqual({
      suggestions: [
        {
          planId: "plan-1",
          date: "2024-01-01T00:00:00.000Z",
          mealType: "Dinner",
          notes: "Use eggs",
          confidence: 0.7,
          rationale: undefined,
        },
      ],
    });
  });

  it("parses recipe parser payload", () => {
    const raw = `{"name":"Toast","description":"Simple","ingredients":["Bread","Butter"],"instructions":["Toast bread","Spread butter"]}`;
    const result = parseAgentResponse("agent_recipe_parser", raw);
    expect(result).toEqual({
      name: "Toast",
      description: "Simple",
      ingredients: ["Bread", "Butter"],
      instructions: ["Toast bread", "Spread butter"],
    });
  });
});
