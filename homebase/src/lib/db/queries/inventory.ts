import { prisma } from "@/lib/db/client";

export interface InventoryFilters {
  search?: string;
  category?: string;
  room?: string;
  tag?: string;
  enrichmentStatus?: string;
  hasAttachments?: boolean;
  completenessMin?: number;
  completenessLt?: number;
}

export async function listInventoryItems(filters: InventoryFilters = {}) {
  const { search, category, room, tag, enrichmentStatus, hasAttachments, completenessMin, completenessLt } = filters;

  const items = await prisma.inventoryItem.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { brand: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        category ? { categories: { has: category } } : {},
        room ? { rooms: { has: room } } : {},
        tag ? { tags: { has: tag } } : {},
        enrichmentStatus ? { enrichmentStatus: enrichmentStatus } : {},
        hasAttachments === true
          ? { attachments: { some: {} } }
          : hasAttachments === false
            ? { attachments: { none: {} } }
            : {},
        completenessMin != null ? { completeness: { gte: completenessMin } } : {},
        completenessLt != null ? { completeness: { lt: completenessLt } } : {},
      ],
    },
    include: {
      attachments: { take: 1, orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return items;
}

export async function getInventoryItem(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      pantryItems: {
        where: { status: "in_stock" },
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          expiresAt: true,
          status: true,
        },
      },
    },
  });
}

export async function getInventoryItemWithAttachments(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: { attachments: true },
  });
}

export async function createInventoryItem(data: {
  name: string;
  brand?: string;
  condition?: string;
  quantity?: number;
  notes?: string;
  categories?: string[];
  rooms?: string[];
  tags?: string[];
}) {
  const completeness = computeCompleteness(data);
  return prisma.inventoryItem.create({
    data: {
      name: data.name,
      brand: data.brand,
      condition: data.condition ?? "good",
      quantity: data.quantity ?? 1,
      notes: data.notes,
      categories: data.categories ?? [],
      rooms: data.rooms ?? [],
      tags: data.tags ?? [],
      completeness,
    },
  });
}

export async function updateInventoryItem(
  id: string,
  data: {
    name?: string;
    brand?: string;
    condition?: string;
    quantity?: number;
    notes?: string;
    categories?: string[];
    rooms?: string[];
    tags?: string[];
  }
) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) throw new Error("Item not found");
  const merged = { ...existing, ...data };
  const completeness = computeCompleteness(merged);
  return prisma.inventoryItem.update({
    where: { id },
    data: { ...data, completeness },
  });
}

export async function deleteInventoryItem(id: string) {
  return prisma.inventoryItem.delete({ where: { id } });
}

export async function addInventoryAttachment(data: {
  itemId: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}) {
  return prisma.inventoryAttachment.create({ data });
}

export async function getDistinctFilterValues() {
  const items = await prisma.inventoryItem.findMany({
    select: {
      categories: true,
      rooms: true,
      tags: true,
      enrichmentStatus: true,
      attachments: { select: { id: true } },
    },
  });

  const categories = new Set<string>();
  const rooms = new Set<string>();
  const tags = new Set<string>();
  const enrichmentStatuses = new Set<string>();
  let hasAnyWithAttachments = false;
  let hasAnyWithoutAttachments = false;

  for (const item of items) {
    item.categories.forEach((c) => categories.add(c));
    item.rooms.forEach((r) => rooms.add(r));
    item.tags.forEach((t) => tags.add(t));
    if (item.enrichmentStatus) enrichmentStatuses.add(item.enrichmentStatus);
    if (item.attachments.length > 0) {
      hasAnyWithAttachments = true;
    } else {
      hasAnyWithoutAttachments = true;
    }
  }

  return {
    categories: Array.from(categories).sort(),
    rooms: Array.from(rooms).sort(),
    tags: Array.from(tags).sort(),
    enrichmentStatuses: Array.from(enrichmentStatuses).sort(),
    hasAttachmentsAvailable: hasAnyWithAttachments,
    hasNoAttachmentsAvailable: hasAnyWithoutAttachments,
  };
}

function computeCompleteness(data: {
  name?: string;
  brand?: string | null;
  condition?: string;
  quantity?: number;
  notes?: string | null;
  categories?: string[];
  rooms?: string[];
  tags?: string[];
}): number {
  const fields = [
    !!data.name,
    !!data.brand,
    !!data.condition,
    (data.quantity ?? 0) > 0,
    !!data.notes,
    (data.categories?.length ?? 0) > 0,
    (data.rooms?.length ?? 0) > 0,
    (data.tags?.length ?? 0) > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
