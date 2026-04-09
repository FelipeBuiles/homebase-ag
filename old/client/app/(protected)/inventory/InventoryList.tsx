"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bulkUpdateInventoryItems } from "./actions";
import { isInventoryComplete, isInventoryEnrichmentPending } from "@/lib/inventory";
import { Loader2, Play } from "lucide-react";

type RoomOption = { id: string; name: string };
type TagOption = { id: string; name: string };
type InventoryItemRow = {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  condition?: string | null;
  serialNumber?: string | null;
  enrichmentStatus?: string | null;
  pantryItems: { id: string; status: string }[];
  categories: string[];
  rooms: RoomOption[];
  tags: TagOption[];
  attachments: { id: string; url: string; kind: "photo" | "video"; order: number }[];
};

type InventoryListProps = {
  items: InventoryItemRow[];
  rooms: RoomOption[];
  tags: TagOption[];
  categories: string[];
};

export function InventoryList({ items, rooms, tags, categories }: InventoryListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.length === items.length,
    [items.length, selectedIds.length]
  );

  const toggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : items.map((item) => item.id));
  };

  return (
    <div className="space-y-6">
      {selectedIds.length > 0 && (
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Bulk edit</CardTitle>
            <CardDescription>
              Update categories, rooms, or tags for {selectedIds.length} selected items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={bulkUpdateInventoryItems} className="space-y-6">
              {selectedIds.map((id) => (
                <input key={id} type="hidden" name="itemIds" value={id} />
              ))}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Categories</p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" name="clearCategories" className="h-4 w-4 accent-primary" />
                    Clear categories
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="addCategories" className="h-4 w-4 accent-primary" />
                  Add to existing
                </label>
                <div className="grid gap-2 md:grid-cols-3">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="categories" value={category} className="h-4 w-4 accent-primary" />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Rooms</p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" name="clearRooms" className="h-4 w-4 accent-primary" />
                    Clear rooms
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="addRooms" className="h-4 w-4 accent-primary" />
                  Add to existing
                </label>
                <div className="grid gap-2 md:grid-cols-3">
                  {rooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rooms yet.</p>
                  ) : (
                    rooms.map((room) => (
                      <label key={room.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="rooms" value={room.id} className="h-4 w-4 accent-primary" />
                        <span>{room.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    name="newRoom"
                    placeholder="Add new room"
                    className="h-9 min-w-[220px] rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">New room applies to all selected items.</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Tags</p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" name="clearTags" className="h-4 w-4 accent-primary" />
                    Clear tags
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="addTags" className="h-4 w-4 accent-primary" />
                  Add to existing
                </label>
                <div className="grid gap-2 md:grid-cols-3">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags yet.</p>
                  ) : (
                    tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="tags" value={tag.id} className="h-4 w-4 accent-primary" />
                        <span>{tag.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    name="newTag"
                    placeholder="Add new tag"
                    className="h-9 min-w-[220px] rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">New tag applies to all selected items.</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="confirmClear" className="h-4 w-4 accent-primary" />
                  Confirm clearing fields (required if any clear is selected)
                </label>
                <Button type="submit">Apply updates</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-primary" />
          Select all
        </label>
        <span className="text-sm text-muted-foreground">
          {selectedIds.length} of {items.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger">
        {items.map((item) => {
          const complete = isInventoryComplete(item);
          const enrichmentPending = isInventoryEnrichmentPending(item);
          const needsCategory = item.categories.length === 0;
          const needsRoom = item.rooms.length === 0;
          const primaryAttachment = item.attachments[0];
          const titleParts = [item.brand, item.model].filter(Boolean).join(" ");
          const hasMetadata = Boolean(titleParts || item.serialNumber || item.condition);
          const enrichmentStatus = item.enrichmentStatus ?? "idle";
          return (
            <Card key={item.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                {primaryAttachment && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-border/60 bg-background/60">
                    {primaryAttachment.kind === "photo" ? (
                      <div className="relative h-32 w-full">
                        <Image
                          src={primaryAttachment.url}
                          alt={`${item.name} attachment`}
                          fill
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-muted text-muted-foreground">
                        <Play className="h-6 w-6" />
                        <span className="ml-2 text-sm">Video</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/inventory/${item.id}`} className="text-lg font-semibold group-hover:text-primary">
                      {item.name}
                  </Link>
                  <CardDescription className="mt-1">
                    {item.rooms.length > 0 ? item.rooms.map((room) => room.name).join(" • ") : "No rooms yet"}
                  </CardDescription>
                  {hasMetadata && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {titleParts && <span>{titleParts}</span>}
                      {item.serialNumber && (
                        <span className={titleParts ? "ml-2 font-mono" : "font-mono"}>#{item.serialNumber}</span>
                      )}
                    </div>
                  )}
                  {enrichmentPending && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Enrichment pending…
                    </div>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {item.categories.length === 0 ? (
                  <Badge variant="outline">Uncategorized</Badge>
                ) : (
                  item.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))
                )}
                {item.pantryItems.length > 0 && (
                  <Badge variant="outline">Pantry linked</Badge>
                )}
                {enrichmentStatus === "pending" && (
                  <Badge variant="outline">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Queued
                    </span>
                  </Badge>
                )}
                {enrichmentStatus === "running" && (
                  <Badge variant="secondary">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Enriching
                    </span>
                  </Badge>
                )}
                {enrichmentStatus === "failed" && (
                  <Badge variant="destructive">Enrichment failed</Badge>
                )}
                {item.condition && <Badge variant="outline">{item.condition}</Badge>}
                {enrichmentPending ? (
                  <Badge variant="secondary">Enriching</Badge>
                ) : (
                  <Badge variant={complete ? "default" : "outline"}>
                    {complete ? "Complete" : "Needs details"}
                  </Badge>
                )}
                {!complete && (
                  <>
                    {needsCategory && <Badge variant="outline">Needs category</Badge>}
                    {needsRoom && <Badge variant="outline">Needs room</Badge>}
                  </>
                )}
              </div>
              {item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag.id} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
