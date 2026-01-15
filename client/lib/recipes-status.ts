type RecipeStatus = "draft" | "ready" | string;
type ParsingStatus = "idle" | "pending" | "parsing" | "filled" | "error" | string;

type PendingInput = {
  status?: RecipeStatus | null;
  parsingStatus?: ParsingStatus | null;
  name?: string | null;
};

export const isRecipePending = ({ status, parsingStatus, name }: PendingInput) => {
  const trimmedName = (name ?? "").trim();
  if (["pending", "parsing", "error"].includes(parsingStatus ?? "")) {
    return true;
  }
  return status === "draft" && trimmedName.length === 0;
};
