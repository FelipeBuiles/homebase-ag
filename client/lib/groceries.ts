import prisma from "@/lib/prisma";

export const buildCanonicalKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-");

export const getOrCreateDefaultGroceryList = async () => {
  const existing = await prisma.groceryList.findFirst({
    where: { isDefault: true },
  });

  if (existing) return existing;

  return await prisma.groceryList.create({
    data: { name: "Groceries", isDefault: true },
  });
};
