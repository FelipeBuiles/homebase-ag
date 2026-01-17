type PantryGroupItem = { id: string; name: string; category: string | null };

type PantryGroup = { category: string; items: PantryGroupItem[] };

export const groupPantryItemsByCategory = (items: PantryGroupItem[]): PantryGroup[] => {
  const groups = new Map<string, PantryGroupItem[]>();

  for (const item of items) {
    const category = item.category?.trim() || "Uncategorized";
    const list = groups.get(category) ?? [];
    list.push(item);
    groups.set(category, list);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupItems]) => ({ category, items: groupItems }));
};
