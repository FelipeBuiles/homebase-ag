import { prisma } from "@/lib/db/client";

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

export async function createGroceryList(name: string) {
  return prisma.groceryList.create({ data: { name } });
}

export async function deleteGroceryList(id: string) {
  return prisma.groceryList.delete({ where: { id } });
}

export async function addGroceryItem(
  listId: string,
  data: { name: string; quantity?: string; unit?: string }
) {
  return prisma.groceryItem.create({
    data: { listId, ...data },
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
