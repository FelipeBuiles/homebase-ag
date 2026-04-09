import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { isInventoryComplete } from "@/lib/inventory";
import { Loader2 } from "lucide-react";

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
  updatedAt: Date;
};

type InventoryTableProps = {
  items: InventoryItemRow[];
};

export function InventoryTable({ items }: InventoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/80">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-3 px-4">Item</th>
            <th className="py-3 px-4">Room</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Tags</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 px-4 text-muted-foreground">
                No inventory items match these filters.
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const complete = isInventoryComplete(item);
              const titleParts = [item.brand, item.model].filter(Boolean).join(" ");
              const roomLabel = item.rooms.length > 0 ? item.rooms.map((room) => room.name).join(", ") : "—";
              const categoryLabel = item.categories.length > 0 ? item.categories.join(", ") : "—";
              const tagLabel = item.tags.length > 0 ? item.tags.map((tag) => `#${tag.name}`).join(" ") : "—";
              const enrichmentStatus = item.enrichmentStatus ?? "idle";
              return (
                <tr key={item.id} className="border-t border-border/60">
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <Link href={`/inventory/${item.id}`} className="font-medium text-foreground hover:text-primary">
                        {item.name}
                      </Link>
                      {titleParts && <div className="text-xs text-muted-foreground">{titleParts}</div>}
                      {item.serialNumber && (
                        <div className="text-xs font-mono text-muted-foreground">#{item.serialNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{roomLabel}</td>
                  <td className="py-3 px-4">{categoryLabel}</td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-muted-foreground">{tagLabel}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={complete ? "default" : "outline"}>
                        {complete ? "Complete" : "Needs details"}
                      </Badge>
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
                      {item.pantryItems.length > 0 && (
                        <Badge variant="outline">Pantry linked</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {item.updatedAt.toLocaleDateString()}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
