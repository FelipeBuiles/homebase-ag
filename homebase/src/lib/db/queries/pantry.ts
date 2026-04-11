import { prisma } from "@/lib/db/client";

export type PantryItemStatus = "in_stock" | "out_of_stock" | "consumed" | "discarded";

export interface PantryFilters {
  search?: string;
  location?: string;
  tab?: "all" | "expiring" | "expired";
  status?: "all" | PantryItemStatus;
  warnDays?: number;
}

export async function listPantryItems(filters: PantryFilters = {}) {
  const now = new Date();
  const { tab, warnDays = 7 } = filters;
  const warnDate = new Date(now.getTime() + warnDays * 24 * 60 * 60 * 1000);

  const statusFilter = filters.status && filters.status !== "all"
    ? { status: filters.status }
    : {};

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
        statusFilter,
      ],
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPantryItem(id: string) {
  return prisma.pantryItem.findUnique({
    where: { id },
    include: { inventoryItem: { select: { id: true, name: true } } },
  });
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
  status?: PantryItemStatus;
  inventoryItemId?: string;
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
    status?: PantryItemStatus;
    statusUpdatedAt?: Date;
    inventoryItemId?: string | null;
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

export async function getRunningLowPantryItems() {
  return prisma.pantryItem.findMany({
    where: { status: "in_stock" },
    orderBy: [{ updatedAt: "desc" }],
  });
}
