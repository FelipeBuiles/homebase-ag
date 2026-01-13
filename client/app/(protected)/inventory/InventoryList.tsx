"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bulkUpdateInventoryItems } from "./actions";
import { isInventoryComplete } from "@/lib/inventory";
import { Play } from "lucide-react";

type RoomOption = { id: string; name: string };
type TagOption = { id: string; name: string };
type InventoryItemRow = {
  id: string;
  name: string;
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
                <p className="text-sm font-medium">Categories</p>
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
                <p className="text-sm font-medium">Rooms</p>
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
                <p className="text-sm font-medium">Tags</p>
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

              <Button type="submit">Apply updates</Button>
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
          const primaryAttachment = item.attachments[0];
          return (
            <Card key={item.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                {primaryAttachment && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-border/60 bg-background/60">
                    {primaryAttachment.kind === "photo" ? (
                      <img
                        src={primaryAttachment.url}
                        alt={`${item.name} attachment`}
                        className="h-32 w-full object-cover"
                      />
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
                <Badge variant={complete ? "default" : "outline"}>
                  {complete ? "Complete" : "Needs details"}
                </Badge>
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
