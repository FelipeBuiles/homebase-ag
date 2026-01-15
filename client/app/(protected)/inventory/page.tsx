import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package } from "lucide-react";
import Link from "next/link";
import { quickAddInventoryItem } from "./actions";
import { DEFAULT_INVENTORY_CATEGORIES, isInventoryComplete, toTitleCase } from "@/lib/inventory";
import { InventoryList } from "./InventoryList";
import { InventoryTable } from "./InventoryTable";

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
  const normalizeParam = (value?: string) => (value && value !== "all" ? value : undefined);
  const status = normalizeParam(getSearchParam(params, "status"));
  const category = normalizeParam(getSearchParam(params, "category"));
  const room = normalizeParam(getSearchParam(params, "room"));
  const tag = normalizeParam(getSearchParam(params, "tag"));
  const hasAttachments = getSearchParam(params, "hasAttachments") === "1";
  const view = getSearchParam(params, "view") === "table" ? "table" : "grid";

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
      { brand: { contains: query, mode: "insensitive" } },
      { model: { contains: query, mode: "insensitive" } },
      { serialNumber: { contains: query, mode: "insensitive" } },
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
    if (status === "needs-category") return item.categories.length === 0;
    if (status === "needs-room") return item.rooms.length === 0;
    if (status === "needs-enrichment") return item.attachments.length > 0 && !complete;
    if (status === "enrichment-failed") return item.enrichmentStatus === "failed";
    return true;
  });
  const withAttachments = hasAttachments
    ? filtered.filter((item) => item.attachments.length > 0)
    : filtered;

  const buildHref = (overrides: Record<string, string | null>) => {
    const search = new URLSearchParams();
    const entries: Record<string, string | undefined> = {
      q: query,
      status,
      category,
      room,
      tag,
      view,
      hasAttachments: hasAttachments ? "1" : undefined,
    };
    Object.entries(entries).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    Object.entries(overrides).forEach(([key, value]) => {
      if (!value) search.delete(key);
      else search.set(key, value);
    });
    const queryString = search.toString();
    return queryString ? `/inventory?${queryString}` : "/inventory";
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Manage your household items.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Link href={buildHref({ view: "grid" })} className="nav-pill" data-active={view === "grid"}>
              Grid
            </Link>
            <Link href={buildHref({ view: "table" })} className="nav-pill" data-active={view === "table"}>
              Table
            </Link>
          </div>
          <Link href="/inventory/new">
            <Button className="gap-2">
              <Plus size={16} /> Add Item
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick filters</CardTitle>
          <CardDescription>Jump to high-signal views.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Link href={buildHref({ status: null, hasAttachments: null })} className="nav-pill" data-active={!status && !hasAttachments}>
            All
          </Link>
          <Link href={buildHref({ status: "incomplete" })} className="nav-pill" data-active={status === "incomplete"}>
            Needs details
          </Link>
          <Link href={buildHref({ status: "needs-category" })} className="nav-pill" data-active={status === "needs-category"}>
            Needs category
          </Link>
          <Link href={buildHref({ status: "needs-room" })} className="nav-pill" data-active={status === "needs-room"}>
            Needs room
          </Link>
          <Link href={buildHref({ status: "needs-enrichment" })} className="nav-pill" data-active={status === "needs-enrichment"}>
            Needs enrichment
          </Link>
          <Link href={buildHref({ status: "enrichment-failed" })} className="nav-pill" data-active={status === "enrichment-failed"}>
            Enrichment failed
          </Link>
          <Link
            href={buildHref({ hasAttachments: hasAttachments ? null : "1" })}
            className="nav-pill"
            data-active={hasAttachments}
          >
            With attachments
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick add</CardTitle>
          <CardDescription>Add an item now and fill details later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={quickAddInventoryItem} className="flex flex-wrap gap-3">
            <Input name="name" placeholder="Item name" className="min-w-[200px] flex-1" required />
            <Input name="attachments" type="file" multiple accept="image/*,video/*" className="min-w-[200px] flex-1" />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search & filter</CardTitle>
          <CardDescription>Find items by name, room, category, or tag.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-4 lg:grid-cols-6">
            <Input name="q" placeholder="Search items..." defaultValue={query ?? ""} className="lg:col-span-2" />
            <input type="hidden" name="view" value={view} />
            <Select name="category" defaultValue={category ?? "all"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {DEFAULT_INVENTORY_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="room" defaultValue={room ?? "all"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rooms</SelectItem>
                {rooms.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="tag" defaultValue={tag ?? "all"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={status ?? "all"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="incomplete">Needs details</SelectItem>
                <SelectItem value="needs-category">Needs category</SelectItem>
                <SelectItem value="needs-room">Needs room</SelectItem>
                <SelectItem value="needs-enrichment">Needs enrichment</SelectItem>
                <SelectItem value="enrichment-failed">Enrichment failed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap items-center gap-2 lg:col-span-6">
              <Button type="submit" size="sm">Apply filters</Button>
              <Link href="/inventory" className="text-sm text-muted-foreground hover:text-primary">
                Clear filters
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {withAttachments.length === 0 ? (
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
        view === "table" ? (
          <InventoryTable
            items={withAttachments.map((item) => ({
              id: item.id,
              name: item.name,
            brand: item.brand,
            model: item.model,
            condition: item.condition,
            serialNumber: item.serialNumber,
            enrichmentStatus: item.enrichmentStatus,
            categories: item.categories,
              rooms: item.rooms.map((room) => ({ id: room.id, name: room.name })),
              tags: item.tags.map((tag) => ({ id: tag.id, name: tag.name })),
              attachments: item.attachments.map((attachment) => ({
                id: attachment.id,
                url: attachment.url,
                kind: attachment.kind as "photo" | "video",
                order: attachment.order,
              })),
              updatedAt: item.updatedAt,
            }))}
          />
        ) : (
          <InventoryList
            items={withAttachments.map((item) => ({
              id: item.id,
              name: item.name,
              brand: item.brand,
              model: item.model,
              condition: item.condition,
              serialNumber: item.serialNumber,
              enrichmentStatus: item.enrichmentStatus,
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
        )
      )}
    </div>
  );
}
