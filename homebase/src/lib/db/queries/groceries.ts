import { prisma } from "@/lib/db/client";

export function buildCanonicalKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+(pack|box|bag|bottle|can|jar|piece|slice|cup|tbsp|tsp|lb|oz|kg|ml)\b$/i, "")
    .replace(/\s+\d+\s*(g|l)\b$/i, "")
    .replace(/\s+/g, " ");
}

export async function listGroceryLists() {
  return prisma.groceryList.findMany({
    include: {
      _count: { select: { items: true } },
      items: {
        where: { checked: false },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGroceryList(id: string) {
  return prisma.groceryList.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getDefaultGroceryList() {
  let list = await prisma.groceryList.findFirst({ where: { isDefault: true } });
  if (!list) {
    list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
  }
  return list;
}

export async function createGroceryList(name: string, isDefault = false) {
  return prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.groceryList.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return tx.groceryList.create({ data: { name, isDefault } });
  });
}

export async function deleteGroceryList(id: string) {
  return prisma.groceryList.delete({ where: { id } });
}

export async function setDefaultGroceryList(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.groceryList.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    return tx.groceryList.update({ where: { id }, data: { isDefault: true } });
  });
}

export async function addGroceryItem(
  listId: string,
  data: { name: string; quantity?: string; unit?: string; source?: string; canonicalKey?: string }
) {
  const canonicalKey = data.canonicalKey ?? buildCanonicalKey(data.name);
  return prisma.groceryItem.create({
    data: { listId, ...data, source: data.source ?? "manual", canonicalKey },
  });
}

export async function removeGroceryItem(id: string) {
  return prisma.groceryItem.delete({ where: { id } });
}

export async function toggleGroceryItem(id: string) {
  const item = await prisma.groceryItem.findUnique({ where: { id } });
  if (!item) throw new Error("Item not found");
  return prisma.groceryItem.update({
    where: { id },
    data: { checked: !item.checked },
  });
}

export async function updateGroceryItem(
  id: string,
  data: { normalizedName?: string | null }
) {
  return prisma.groceryItem.update({ where: { id }, data });
}

export async function getGroceryListItems(listId: string) {
  return prisma.groceryItem.findMany({
    where: { listId },
    orderBy: { createdAt: "asc" },
  });
}

export async function findDuplicatesInList(listId: string) {
  const items = await prisma.groceryItem.findMany({
    where: { listId, checked: false },
  });

  const groups: Map<string, typeof items> = new Map();
  for (const item of items) {
    const key = item.canonicalKey ?? buildCanonicalKey(item.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ canonicalKey: key, items }));
}

export async function mergeGroceryItems(keepId: string, mergeIds: string[]) {
  // Prevent accidentally deleting the item we want to keep
  const safeMergeIds = mergeIds.filter((id) => id !== keepId);
  if (safeMergeIds.length === 0) return;

  await prisma.$transaction(async (tx) => {
    const mergedFrom = await tx.groceryItem.findMany({
      where: { id: { in: safeMergeIds } },
      select: { id: true, name: true, quantity: true },
    });

    await tx.groceryItem.deleteMany({ where: { id: { in: safeMergeIds } } });

    await tx.groceryItem.update({
      where: { id: keepId },
      data: { mergedFrom: mergedFrom as object },
    });
  });
}
