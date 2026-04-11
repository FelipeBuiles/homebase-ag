export type GrocerySourceInfo = {
  kind: "manual" | "recipe" | "recipe-missing" | "meal-plan" | "meal-plan-missing" | "pantry-restock" | "other";
  label: string | null;
  detailName: string | null;
};

export function encodeRecipeSource(title: string, mode: "all" | "missing") {
  return `${mode === "missing" ? "recipe-missing" : "recipe"}:${title}`;
}

export function encodeMealPlanSource(planName: string, mode: "all" | "missing") {
  return `${mode === "missing" ? "meal-plan-missing" : "meal-plan"}:${planName}`;
}

export function encodePantryRestockSource(itemName: string) {
  return `pantry-restock:${itemName}`;
}

export function parseGrocerySource(source: string | null | undefined): GrocerySourceInfo {
  if (!source || source === "manual") {
    return { kind: "manual", label: null, detailName: null };
  }

  const [prefix, ...rest] = source.split(":");
  const detail = rest.length > 0 ? rest.join(":").trim() : null;

  switch (prefix) {
    case "recipe":
      return { kind: "recipe", label: "recipe", detailName: detail };
    case "recipe-missing":
      return { kind: "recipe-missing", label: "recipe-missing", detailName: detail };
    case "meal-plan":
      return { kind: "meal-plan", label: "meal-plan", detailName: detail };
    case "meal-plan-missing":
      return { kind: "meal-plan-missing", label: "meal-plan-missing", detailName: detail };
    case "pantry-restock":
      return { kind: "pantry-restock", label: "pantry-restock", detailName: detail };
    default:
      return { kind: "other", label: source, detailName: null };
  }
}
