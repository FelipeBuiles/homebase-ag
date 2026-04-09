import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, Package } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompletenessBar } from "@/components/inventory/completeness-bar";
import { DeleteItemDialog } from "@/components/inventory/delete-item-dialog";
import { getInventoryItem } from "@/lib/db/queries/inventory";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

const conditionVariant: Record<string, "success" | "warning" | "danger"> = {
  good: "success",
  fair: "warning",
  poor: "danger",
};

export default async function InventoryItemPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getInventoryItem(id);
  if (!item) notFound();

  return (
    <PageShell
      title={item.name}
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/inventory/${id}/edit`} />}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <DeleteButtonClient itemId={id} itemName={item.name} />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Photos */}
          {item.attachments.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {item.attachments.map((att) => (
                <div
                  key={att.id}
                  className="aspect-square rounded-lg overflow-hidden border border-base-200 bg-base-50"
                >
                  <Image
                    src={att.url}
                    alt={item.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-video max-w-sm rounded-lg border border-dashed border-base-200 bg-base-50 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-8 w-8 text-base-300 mx-auto mb-2" />
                <p className="text-xs text-base-400">No photos yet</p>
                <Button variant="ghost" size="sm" className="mt-2" render={<Link href={`/inventory/${id}/edit`} />}>
                  Add photo
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide">Notes</h3>
              <p className="text-sm text-base-700 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-base-100 text-base-600 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-base-200 bg-white p-4 space-y-3">
            <SidebarRow label="Condition">
              <Badge variant={conditionVariant[item.condition] ?? "default"}>
                {item.condition}
              </Badge>
            </SidebarRow>

            <SidebarRow label="Quantity">
              <span className="text-sm text-base-800 font-mono">{item.quantity}</span>
            </SidebarRow>

            {item.brand && (
              <SidebarRow label="Brand">
                <span className="text-sm text-base-800">{item.brand}</span>
              </SidebarRow>
            )}

            {item.rooms.length > 0 && (
              <SidebarRow label="Rooms">
                <div className="flex flex-wrap gap-1">
                  {item.rooms.map((r) => (
                    <span key={r} className="text-xs bg-base-100 text-base-600 px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              </SidebarRow>
            )}

            {item.categories.length > 0 && (
              <SidebarRow label="Categories">
                <div className="flex flex-wrap gap-1">
                  {item.categories.map((c) => (
                    <span key={c} className="text-xs bg-base-100 text-base-600 px-2 py-0.5 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              </SidebarRow>
            )}

            <SidebarRow label="Completeness">
              <CompletenessBar value={item.completeness} showLabel />
            </SidebarRow>

            <div className="pt-2 border-t border-base-100 space-y-1">
              <p className="text-xs text-base-400">Added {formatDate(item.createdAt)}</p>
              <p className="text-xs text-base-400">Updated {formatDate(item.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function SidebarRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-base-500 pt-0.5 shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

// Client component for delete with dialog
import { DeleteButtonClient } from "@/components/inventory/delete-button-client";
