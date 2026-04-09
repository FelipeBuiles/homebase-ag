"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Pencil, Trash2, MoreHorizontal, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "next-safe-action/hooks";
import { markOpenedAction, deletePantryItemAction } from "@/actions/pantry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";

interface PantryRowProps {
  item: {
    id: string;
    name: string;
    brand?: string | null;
    location?: string | null;
    quantity: number;
    unit?: string | null;
    expiresAt?: Date | null;
    openedAt?: Date | null;
  };
  warnDays?: number;
  onDeleted?: (id: string) => void;
}

type ExpiryStatus = "expired" | "expiring" | "fresh" | "none";

function getExpiryStatus(expiresAt: Date | null | undefined, warnDays = 7): ExpiryStatus {
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
  expiring: "Expiring",
  fresh: "Fresh",
  none: "No date",
};

export function PantryRow({ item, warnDays = 7, onDeleted }: PantryRowProps) {
  const router = useRouter();
  const status = getExpiryStatus(item.expiresAt, warnDays);

  const { execute: execMarkOpened } = useAction(markOpenedAction, {
    onSuccess: () => toast.success("Marked as opened"),
    onError: () => toast.error("Failed to update"),
  });

  const { execute: execDelete } = useAction(deletePantryItemAction, {
    onSuccess: () => {
      toast.success("Item removed");
      onDeleted?.(item.id);
    },
    onError: () => toast.error("Failed to remove item"),
  });

  const qtyLabel = item.unit ? `${item.quantity} ${item.unit}` : `×${item.quantity}`;

  return (
    <div className="flex items-center gap-3 h-14 px-4 hover:bg-base-50 group">
      {/* Icon */}
      <div className="h-8 w-8 rounded flex-shrink-0 bg-base-100 flex items-center justify-center">
        <Archive className="h-4 w-4 text-base-400" />
      </div>

      {/* Name + meta */}
      <Link href={`/pantry/${item.id}`} className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-sm font-medium text-base-800 truncate">{item.name}</span>
          {item.brand && (
            <span className="text-xs text-base-400 truncate hidden sm:block">{item.brand}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {item.location && (
            <span className="text-xs text-base-500">{item.location}</span>
          )}
          {item.expiresAt && (
            <span
              className={cn(
                "text-xs",
                status === "expired" ? "text-danger" : status === "expiring" ? "text-warning" : "text-base-400"
              )}
            >
              {formatRelativeDate(item.expiresAt)}
            </span>
          )}
        </div>
      </Link>

      {/* Qty */}
      <span className="text-xs text-base-500 tabular-nums hidden sm:block">{qtyLabel}</span>

      {/* Status badge */}
      <Badge variant={statusVariant[status]} className="hidden sm:inline-flex">
        {statusLabel[status]}
      </Badge>

      {/* Action menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded text-base-400 hover:text-base-700 hover:bg-base-100 transition-colors",
            "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/pantry/${item.id}/edit`)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
          {!item.openedAt && (
            <DropdownMenuItem onClick={() => execMarkOpened({ id: item.id })}>
              <PackageOpen className="h-3.5 w-3.5 mr-2" />
              Mark as opened
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => execDelete({ id: item.id })}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
