export const isRecipePolling = (parsingStatus?: string | null) =>
  ["pending", "parsing"].includes(parsingStatus ?? "");
