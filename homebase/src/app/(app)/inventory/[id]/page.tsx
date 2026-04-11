import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Camera, FolderTree, Package, Pencil, Sparkles, Warehouse } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompletenessBar } from "@/components/inventory/completeness-bar";
import { getInventoryItem } from "@/lib/db/queries/inventory";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { DeleteButtonClient } from "@/components/inventory/delete-button-client";

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
      backHref="/inventory"
      backLabel="All inventory"
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/inventory/${id}/edit`} />}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <DeleteButtonClient itemId={id} itemName={item.name} />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.95fr)]">
        <div className="space-y-6 min-w-0">
          <section className="surface-illustrated warm-glow rounded-[1.8rem] border border-[rgba(123,89,64,0.12)] bg-white/92 p-6 md:p-7">
            <div className="flex flex-wrap items-start gap-3">
              <Badge variant={conditionVariant[item.condition] ?? "default"} className="px-3 py-1 text-sm capitalize">
                {item.condition}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                {item.completeness}% complete
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <MetricCard icon={Package} label="Quantity" value={String(item.quantity)} tone="accent" />
              <MetricCard
                icon={Warehouse}
                label="Rooms"
                value={item.rooms.length > 0 ? item.rooms.join(", ") : "Unassigned"}
              />
              <MetricCard
                icon={FolderTree}
                label="Categories"
                value={item.categories.length > 0 ? item.categories.join(", ") : "Unsorted"}
              />
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-base-200/80 bg-base-50/70 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-base-500">Inventory role</p>
                  <p className="mt-3 text-[0.98rem] leading-7 text-base-700">
                    This record is for a durable household item and its storage context. If this item becomes part of your food-on-hand workflow, track the consumable state separately in Pantry.
                  </p>
                </div>
                <div className="min-w-[14rem] rounded-[1.1rem] border border-base-200 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-500">Completeness</p>
                  <div className="mt-3">
                    <CompletenessBar value={item.completeness} showLabel />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-base-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-base-900">Photos</h2>
                <p className="mt-1 text-sm leading-6 text-base-600">
                  Visual reference for recognition, condition, and placement.
                </p>
              </div>
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/inventory/${id}/edit`} />}>
                <Camera className="h-4 w-4" />
                Manage photos
              </Button>
            </div>

            {item.attachments.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {item.attachments.map((att, index) => (
                  <div
                    key={att.id}
                    className={`overflow-hidden rounded-[1.35rem] border border-base-200 bg-base-50 ${
                      index === 0 ? "sm:col-span-2 xl:col-span-2 xl:row-span-2" : ""
                    }`}
                  >
                    <div className={index === 0 ? "aspect-[4/3]" : "aspect-square"}>
                      <Image
                        src={att.url}
                        alt={item.name}
                        width={800}
                        height={800}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex min-h-[16rem] items-center justify-center rounded-[1.35rem] border border-dashed border-base-200 bg-base-50/70">
                <div className="text-center">
                  <Camera className="mx-auto mb-3 h-9 w-9 text-base-300" />
                  <p className="text-sm text-base-500">No photos yet</p>
                  <Button variant="ghost" size="sm" className="mt-3" nativeButton={false} render={<Link href={`/inventory/${id}/edit`} />}>
                    Add photo
                  </Button>
                </div>
              </div>
            )}
          </section>

          {(item.notes || item.tags.length > 0) && (
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
              <div className="rounded-[1.5rem] border border-base-200 bg-white p-6">
                <h2 className="font-display text-xl font-semibold text-base-900">Notes</h2>
                {item.notes ? (
                  <p className="mt-3 whitespace-pre-wrap text-[0.98rem] leading-7 text-base-700">{item.notes}</p>
                ) : (
                  <p className="mt-3 text-sm italic text-base-400">No notes yet.</p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-base-200 bg-base-50/70 p-6">
                <h2 className="font-display text-xl font-semibold text-base-900">Tags</h2>
                {item.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-base-200 bg-white px-3 py-1 text-sm text-base-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm italic text-base-400">No tags yet.</p>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5 min-w-0">
          <div className="rounded-[1.5rem] border border-base-200 bg-white p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-base-900">Details</h2>
              {item.brand && <Badge variant="secondary">{item.brand}</Badge>}
            </div>
            <div className="mt-5 space-y-3">
              <DetailRow label="Quantity" value={String(item.quantity)} />
              <DetailRow label="Condition" value={item.condition} className="capitalize" />
              <DetailRow label="Added" value={formatDate(item.createdAt)} />
              <DetailRow label="Updated" value={formatDate(item.updatedAt)} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-base-200 bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-base-900">Pantry tracking</h2>
                <p className="mt-2 text-sm leading-6 text-base-600">
                  Pantry is where consumable state lives: quantity on hand, expiration, and restock pressure.
                </p>
              </div>
              <Sparkles className="h-5 w-5 shrink-0 text-accent-600" />
            </div>

            <Button
              className="mt-5 w-full"
              nativeButton={false}
              render={
                <Link
                  href={`/pantry/new?name=${encodeURIComponent(item.name)}${item.brand ? `&brand=${encodeURIComponent(item.brand)}` : ""}&inventoryItemId=${item.id}`}
                />
              }
            >
              Track in pantry
            </Button>

            {item.pantryItems.length > 0 ? (
              <div className="mt-5 space-y-3">
                {item.pantryItems.map((pantryItem) => (
                  <Link
                    key={pantryItem.id}
                    href={`/pantry/${pantryItem.id}`}
                    className="block rounded-[1.1rem] border border-base-200 bg-base-50/70 px-4 py-4 transition-colors hover:bg-base-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-medium text-base-900">{pantryItem.name}</p>
                        <p className="mt-1 text-sm text-base-500">
                          {pantryItem.unit ? `${pantryItem.quantity} ${pantryItem.unit}` : `${pantryItem.quantity} left`}
                          {pantryItem.expiresAt ? ` · ${formatRelativeDate(pantryItem.expiresAt)}` : ""}
                        </p>
                      </div>
                      <Badge variant="success" className="shrink-0">In pantry</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-base-500">No linked pantry entries yet.</p>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "accent";
}) {
  return (
    <div className={`rounded-[1.25rem] border p-4 ${tone === "accent" ? "border-accent-200 bg-accent-50/70" : "border-base-200 bg-white/75"}`}>
      <div className="flex items-center gap-2 text-base-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-3 break-words text-lg font-semibold text-base-900">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-base-200 bg-base-50/70 px-4 py-3">
      <span className="text-sm font-medium text-base-600">{label}</span>
      <span className={`text-sm text-base-900 ${className ?? ""}`}>{value}</span>
    </div>
  );
}
