type PantryGroup<T> = { category: string; items: T[] };

export const groupPantryItemsByCategory = <T extends { category: string | null }>(
  items: T[]
): PantryGroup<T>[] => {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const category = item.category?.trim() || "Uncategorized";
    const list = groups.get(category) ?? [];
    list.push(item);
    groups.set(category, list);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    })
    .map(([category, groupItems]) => ({ category, items: groupItems }));
};
