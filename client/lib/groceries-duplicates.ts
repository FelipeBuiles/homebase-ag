type GroceryDuplicateItem = {
  id: string;
  name: string;
  canonicalKey: string | null;
  normalizedName?: string | null;
};

type DuplicateGroup = {
  key: string;
  items: GroceryDuplicateItem[];
};

export const findDuplicateGroups = (items: GroceryDuplicateItem[]): DuplicateGroup[] => {
  const groups = new Map<string, GroceryDuplicateItem[]>();

  for (const item of items) {
    const key = item.canonicalKey || item.normalizedName || item.name;
    if (!key) continue;

    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([key, groupItems]) => ({ key, items: groupItems }))
    .filter((group) => group.items.length > 1);
};
