import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package } from "lucide-react";
import Link from "next/link";
import { quickAddInventoryItem } from "./actions";
import { DEFAULT_INVENTORY_CATEGORIES, isInventoryComplete, toTitleCase } from "@/lib/inventory";
import { InventoryList } from "./InventoryList";

type SearchParams = Record<string, string | string[] | undefined>;

const getSearchParam = (searchParams: SearchParams, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = getSearchParam(params, "q")?.trim();
  const status = getSearchParam(params, "status");
  const category = getSearchParam(params, "category");
  const room = getSearchParam(params, "room");
  const tag = getSearchParam(params, "tag");

  const [rooms, tags] = await Promise.all([
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const where: Prisma.InventoryItemWhereInput = {};
  if (category) {
    where.categories = { has: category };
  }
  if (room) {
    where.rooms = { some: { id: room } };
  }
  if (tag) {
    where.tags = { some: { id: tag } };
  }
  if (query) {
    const normalizedQuery = toTitleCase(query);
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { rooms: { some: { name: { contains: query, mode: "insensitive" } } } },
      { tags: { some: { name: { contains: query, mode: "insensitive" } } } },
      normalizedQuery ? { categories: { has: normalizedQuery } } : undefined,
    ].filter(Boolean) as Prisma.InventoryItemWhereInput["OR"];
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      rooms: true,
      tags: true,
      attachments: { orderBy: { order: "asc" } },
    },
  });
  const filtered = items.filter((item) => {
    if (!status) return true;
    const complete = isInventoryComplete(item);
    if (status === "complete") return complete;
    if (status === "incomplete") return !complete;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage your household items.</p>
        </div>
        <Link href="/inventory/new">
          <Button className="gap-2">
            <Plus size={16} /> Add Item
          </Button>
        </Link>
      </div>

      <Card className="mb-8 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick add</CardTitle>
          <CardDescription>Add an item now and fill details later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={quickAddInventoryItem} encType="multipart/form-data" className="flex flex-wrap gap-3">
            <Input name="name" placeholder="Item name" className="min-w-[220px] flex-1" required />
            <Input name="attachments" type="file" multiple accept="image/*,video/*" className="min-w-[220px] flex-1" />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-8 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search & filter</CardTitle>
          <CardDescription>Find items by name, room, category, or tag.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input name="q" placeholder="Search items..." defaultValue={query ?? ""} className="lg:col-span-2" />
            <select name="category" defaultValue={category ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All categories</option>
              {DEFAULT_INVENTORY_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select name="room" defaultValue={room ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All rooms</option>
              {rooms.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select name="tag" defaultValue={tag ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All tags</option>
              {tags.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={status ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Any status</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Needs details</option>
            </select>
            <div className="flex flex-wrap items-center gap-2 lg:col-span-5">
              <Button type="submit" size="sm">Apply filters</Button>
              <Link href="/inventory" className="text-sm text-muted-foreground hover:text-primary">
                Clear filters
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/70 rounded-2xl bg-card/70">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No items yet</h3>
          <p className="text-muted-foreground mb-4">
            {status ? "No items match this filter." : "Start by adding things you own."}
          </p>
          {!status && (
            <Link href="/inventory/new">
              <Button>Add First Item</Button>
            </Link>
          )}
          {status && (
            <Link href="/inventory" className="text-sm text-primary hover:underline">
              Clear filter
            </Link>
          )}
        </div>
      ) : (
        <InventoryList
          items={filtered.map((item) => ({
            id: item.id,
            name: item.name,
            categories: item.categories,
            rooms: item.rooms.map((room) => ({ id: room.id, name: room.name })),
            tags: item.tags.map((tag) => ({ id: tag.id, name: tag.name })),
            attachments: item.attachments.map((attachment) => ({
              id: attachment.id,
              url: attachment.url,
              kind: attachment.kind as "photo" | "video",
              order: attachment.order,
            })),
          }))}
          rooms={rooms.map((room) => ({ id: room.id, name: room.name }))}
          tags={tags.map((tag) => ({ id: tag.id, name: tag.name }))}
          categories={DEFAULT_INVENTORY_CATEGORIES}
        />
      )}
    </div>
  );
}
