type NameDerivationInput = {
  proposedName?: string | null;
  proposedBrand?: string | null;
  proposedModel?: string | null;
  itemBrand?: string | null;
  itemModel?: string | null;
  tags?: string[];
};

const isGenericName = (value: string) =>
  ["new item", "item", "unknown item"].includes(value.trim().toLowerCase());

export const deriveNameSuggestion = (input: NameDerivationInput) => {
  const proposedName = (input.proposedName ?? "").trim();
  const proposedBrand = (input.proposedBrand ?? "").trim();
  const proposedModel = (input.proposedModel ?? "").trim();
  const itemBrand = (input.itemBrand ?? "").trim();
  const itemModel = (input.itemModel ?? "").trim();
  const tags = input.tags ?? [];

  const isProposedNameGeneric = Boolean(proposedName) && isGenericName(proposedName);
  const derivedNameFromBrandModel = [proposedBrand, proposedModel].filter(Boolean).join(" ").trim();
  const derivedNameFromExisting = [itemBrand, itemModel].filter(Boolean).join(" ").trim();
  const derivedNameFromTags = tags.length > 0 ? tags[0] : "";
  const fallbackName = derivedNameFromBrandModel || derivedNameFromExisting || derivedNameFromTags;

  const derivedName = (isProposedNameGeneric || !proposedName) && fallbackName ? fallbackName : proposedName;
  const usedFallback = Boolean((isProposedNameGeneric || !proposedName) && fallbackName);

  return {
    name: derivedName,
    usedFallback,
  };
};
