import prisma from "@/lib/prisma";
import { groceryQueue } from "@/lib/queue";

export async function enqueueMissingGroceryNormalizations() {
  const items = await prisma.groceryItem.findMany({
    where: {
      OR: [{ normalizedName: null }, { canonicalKey: null }],
    },
    select: { id: true, name: true },
  });

  for (const item of items) {
    await groceryQueue.add("created", { itemId: item.id, name: item.name });
  }

  return items.length;
}
