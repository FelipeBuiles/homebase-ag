import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarClock, ExternalLink, Package2, Pencil, Warehouse } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPantryItem, getWarnDays } from "@/lib/db/queries/pantry";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { DeletePantryButton } from "@/components/pantry/delete-pantry-button";
import { StatusActions } from "@/components/pantry/status-actions";
import { ContextualReviewPanel } from "@/components/review/contextual-review-panel";
import {
  type PantryLifecycleStatus,
  lifecycleStatusVariant as lifecycleVariant,
  lifecycleStatusLabel as lifecycleLabel,
  expiryStatusVariant as expiryVariant,
  expiryStatusLabel as expiryLabel,
  getExpiryStatus,
  getPantryStockSignal,
} from "@/lib/pantry-utils";
import { RestockButton } from "@/components/pantry/restock-button";
import { listPendingByEntity } from "@/lib/db/queries/proposals";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PantryItemPage({ params }: PageProps) {
  const { id } = await params;
  const [item, warnDays] = await Promise.all([getPantryItem(id), getWarnDays()]);
  if (!item) notFound();

  const proposals = await listPendingByEntity("pantry", id);
  const expiryStatus = getExpiryStatus(item.expiresAt, warnDays);
  const lifecycle = (item.status ?? "in_stock") as PantryLifecycleStatus;
  const stockSignal = getPantryStockSignal(item);

  return (
    <PageShell
      title={item.name}
      backHref="/pantry"
      backLabel="All pantry items"
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/pantry/${id}/edit`} />}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <DeletePantryButton itemId={id} itemName={item.name} />
        </div>
      }
    >
      <div className="space-y-6">
        <ContextualReviewPanel
          title="Pantry review"
          description="Expiration and pantry maintenance suggestions for this item."
          proposals={proposals}
          entityNames={{ [id]: item.name }}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.95fr)]">
          <div className="space-y-6 min-w-0">
            <section className="surface-illustrated warm-glow rounded-[1.8rem] border border-[rgba(123,89,64,0.12)] bg-white/92 p-6 md:p-7">
              <div className="flex flex-wrap items-start gap-3">
                <Badge variant={lifecycleVariant[lifecycle]} className="px-3 py-1 text-sm">
                  {lifecycleLabel[lifecycle]}
                </Badge>
                <Badge variant={expiryVariant[expiryStatus]} className="px-3 py-1 text-sm">
                  {expiryLabel[expiryStatus]}
                </Badge>
                {stockSignal === "low" && lifecycle === "in_stock" && (
                  <Badge variant="warning" className="px-3 py-1 text-sm">
                    Running low
                  </Badge>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={Package2}
                  label="On hand"
                  value={`${item.quantity}${item.unit ? ` ${item.unit}` : ""}`}
                  tone="accent"
                />
                <MetricCard icon={Warehouse} label="Storage" value={item.location || "Unassigned"} />
                <MetricCard
                  icon={CalendarClock}
                  label={item.expiresAt ? "Expires" : "Opened"}
                  value={
                    item.expiresAt
                      ? formatRelativeDate(item.expiresAt)
                      : item.openedAt
                        ? formatDate(item.openedAt)
                        : "Not tracked"
                  }
                />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)]">
                <div className="rounded-[1.4rem] border border-base-200/80 bg-base-50/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-base-500">Notes</p>
                  {item.notes ? (
                    <p className="mt-3 whitespace-pre-wrap break-words text-[0.98rem] leading-7 text-base-700">
                      {item.notes}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-base-400">No notes yet.</p>
                  )}
                </div>

                <div className="rounded-[1.4rem] border border-base-200/80 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-base-500">Details</p>
                  <div className="mt-4 space-y-4">
                    {item.brand && <DetailBlock label="Brand" value={item.brand} />}
                    {item.expiresAt && (
                      <DetailBlock
                        label="Expiry date"
                        value={formatDate(item.expiresAt)}
                        valueClassName={
                          expiryStatus === "expired"
                            ? "text-danger"
                            : expiryStatus === "expiring"
                              ? "text-warning"
                              : undefined
                        }
                      />
                    )}
                    {item.openedAt && <DetailBlock label="Opened" value={formatDate(item.openedAt)} />}
                    <DetailBlock label="Added" value={formatDate(item.createdAt)} />
                  </div>
                </div>
              </div>
            </section>

            {item.inventoryItem && (
              <section className="rounded-[1.5rem] border border-base-200 bg-white p-6">
                <h2 className="font-display text-xl font-semibold text-base-900">Linked inventory item</h2>
                <p className="mt-1 text-sm leading-6 text-base-600">
                  Durable storage context lives in Inventory. Pantry tracks the consumable state.
                </p>
                <Link
                  href={`/inventory/${item.inventoryItem.id}`}
                  className="mt-5 flex items-center justify-between gap-4 rounded-[1.2rem] border border-base-200 bg-base-50/70 px-4 py-4 text-base-800 transition-colors hover:bg-base-50"
                >
                  <div className="min-w-0">
                    <p className="text-base font-medium">{item.inventoryItem.name}</p>
                    <p className="mt-1 text-sm text-base-500">
                      Open the household record for photos, organization, and durable context.
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-accent-600" />
                </Link>
              </section>
            )}
          </div>

          <aside className="space-y-5 min-w-0">
            <div className="rounded-[1.5rem] border border-base-200 bg-white p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-base-900">Status</h2>
                <Badge variant={lifecycleVariant[lifecycle]}>{lifecycleLabel[lifecycle]}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-base-600">
                Update how this pantry item is behaving right now.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant={expiryVariant[expiryStatus]}>{expiryLabel[expiryStatus]}</Badge>
                {stockSignal === "low" && lifecycle === "in_stock" && (
                  <Badge variant="warning">Running low</Badge>
                )}
              </div>
              <div className="mt-5">
                <StatusActions itemId={id} currentStatus={lifecycle} />
              </div>
            </div>

            {stockSignal === "low" && lifecycle === "in_stock" && (
              <div className="rounded-[1.5rem] border border-warning/25 bg-warning/5 p-5 md:p-6">
                <h2 className="font-display text-xl font-semibold text-base-900">Restock</h2>
                <p className="mt-2 text-sm leading-6 text-base-600">
                  This item looks low based on the current quantity. Send it to groceries in one step.
                </p>
                <div className="mt-5">
                  <RestockButton pantryItemId={id} name={item.name} quantity={item.quantity} unit={item.unit} />
                </div>
              </div>
            )}

            <div className="rounded-[1.5rem] border border-base-200 bg-base-50/70 p-5 md:p-6">
              <h2 className="font-display text-xl font-semibold text-base-900">Timeline</h2>
              <div className="mt-4 space-y-3">
                <TimelineRow label="Added" value={formatDate(item.createdAt)} />
                {item.openedAt && <TimelineRow label="Opened" value={formatDate(item.openedAt)} />}
                {item.expiresAt && <TimelineRow label="Expires" value={formatDate(item.expiresAt)} />}
              </div>
            </div>
          </aside>
        </div>
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

function DetailBlock({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-500">{label}</p>
      <p className={`break-words text-[0.98rem] text-base-800 ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-base-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-base-600">{label}</span>
      <span className="text-sm text-base-900">{value}</span>
    </div>
  );
}
