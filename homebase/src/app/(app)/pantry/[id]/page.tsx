import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPantryItem, getWarnDays } from "@/lib/db/queries/pantry";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { DeletePantryButton } from "@/components/pantry/delete-pantry-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ExpiryStatus = "expired" | "expiring" | "fresh" | "none";

function getExpiryStatus(expiresAt: Date | null | undefined, warnDays: number): ExpiryStatus {
  if (!expiresAt) return "none";
  const now = new Date();
  const warnDate = new Date(now.getTime() + warnDays * 24 * 60 * 60 * 1000);
  if (expiresAt < now) return "expired";
  if (expiresAt < warnDate) return "expiring";
  return "fresh";
}

const statusVariant: Record<ExpiryStatus, "danger" | "warning" | "success" | "default"> = {
  expired: "danger",
  expiring: "warning",
  fresh: "success",
  none: "default",
};

const statusLabel: Record<ExpiryStatus, string> = {
  expired: "Expired",
  expiring: "Expiring soon",
  fresh: "Fresh",
  none: "No expiry date",
};

export default async function PantryItemPage({ params }: PageProps) {
  const { id } = await params;
  const [item, warnDays] = await Promise.all([getPantryItem(id), getWarnDays()]);
  if (!item) notFound();

  const status = getExpiryStatus(item.expiresAt, warnDays);

  return (
    <PageShell
      title={item.name}
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/pantry/${id}/edit`} />}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <DeletePantryButton itemId={id} itemName={item.name} />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Notes */}
        <div className="space-y-4">
          {item.notes ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide">Notes</h3>
              <p className="text-sm text-base-700 whitespace-pre-wrap">{item.notes}</p>
            </div>
          ) : (
            <p className="text-sm text-base-400 italic">No notes.</p>
          )}
        </div>

        {/* Sidebar */}
        <div className="rounded-lg border border-base-200 bg-white p-4 space-y-3 self-start">
          <SidebarRow label="Status">
            <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
          </SidebarRow>

          {item.brand && (
            <SidebarRow label="Brand">
              <span className="text-sm text-base-800">{item.brand}</span>
            </SidebarRow>
          )}

          {item.location && (
            <SidebarRow label="Location">
              <span className="text-sm text-base-800">{item.location}</span>
            </SidebarRow>
          )}

          <SidebarRow label="Quantity">
            <span className="text-sm text-base-800 font-mono">
              {item.quantity}{item.unit ? ` ${item.unit}` : ""}
            </span>
          </SidebarRow>

          {item.expiresAt && (
            <SidebarRow label="Expires">
              <span className={`text-sm ${status === "expired" ? "text-danger" : status === "expiring" ? "text-warning" : "text-base-800"}`}>
                {formatRelativeDate(item.expiresAt)}
              </span>
            </SidebarRow>
          )}

          {item.openedAt && (
            <SidebarRow label="Opened">
              <span className="text-sm text-base-800">{formatDate(item.openedAt)}</span>
            </SidebarRow>
          )}

          <div className="pt-2 border-t border-base-100 space-y-1">
            <p className="text-xs text-base-400">Added {formatDate(item.createdAt)}</p>
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
