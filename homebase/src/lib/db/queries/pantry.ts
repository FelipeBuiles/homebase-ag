import { prisma } from "@/lib/db/client";

export interface PantryFilters {
  search?: string;
  location?: string;
  tab?: "all" | "expiring" | "expired";
  warnDays?: number;
}

export async function listPantryItems(filters: PantryFilters = {}) {
  const now = new Date();
  const { tab, warnDays = 7 } = filters;
  const warnDate = new Date(now.getTime() + warnDays * 24 * 60 * 60 * 1000);

  return prisma.pantryItem.findMany({
    where: {
      AND: [
        filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { brand: { contains: filters.search, mode: "insensitive" } },
                { location: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {},
        filters.location
          ? { location: { contains: filters.location, mode: "insensitive" } }
          : {},
        tab === "expired"
          ? { expiresAt: { lt: now } }
          : tab === "expiring"
          ? { expiresAt: { gte: now, lt: warnDate } }
          : {},
      ],
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPantryItem(id: string) {
  return prisma.pantryItem.findUnique({ where: { id } });
}

export async function createPantryItem(data: {
  name: string;
  brand?: string;
  location?: string;
  quantity?: number;
  unit?: string;
  expiresAt?: Date;
  openedAt?: Date;
  notes?: string;
}) {
  return prisma.pantryItem.create({ data });
}

export async function updatePantryItem(
  id: string,
  data: {
    name?: string;
    brand?: string | null;
    location?: string | null;
    quantity?: number;
    unit?: string | null;
    expiresAt?: Date | null;
    openedAt?: Date | null;
    notes?: string | null;
  }
) {
  return prisma.pantryItem.update({ where: { id }, data });
}

export async function deletePantryItem(id: string) {
  return prisma.pantryItem.delete({ where: { id } });
}

export async function listPantryItemsForAgent() {
  return prisma.pantryItem.findMany({
    where: { expiresAt: { not: null } },
    orderBy: { expiresAt: "asc" },
  });
}

export async function getWarnDays(): Promise<number> {
  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  return config?.pantryWarnDays ?? 7;
}
