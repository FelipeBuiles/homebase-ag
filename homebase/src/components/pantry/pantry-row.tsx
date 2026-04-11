"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Pencil, Trash2, MoreHorizontal, PackageOpen, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "next-safe-action/hooks";
import { markOpenedAction, deletePantryItemAction, updatePantryStatusAction } from "@/actions/pantry";
import { toast } from "sonner";
import { cn, formatRelativeDate } from "@/lib/utils";
import {
  type PantryLifecycleStatus,
  lifecycleStatusVariant,
  lifecycleStatusLabel,
  expiryStatusVariant as statusVariant,
  expiryStatusLabel as statusLabel,
  getExpiryStatus,
  getPantryStockSignal,
} from "@/lib/pantry-utils";
import { RestockButton } from "@/components/pantry/restock-button";

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
    status?: string | null;
  };
  warnDays?: number;
  onDeleted?: (id: string) => void;
}

export function PantryRow({ item, warnDays = 7, onDeleted }: PantryRowProps) {
  const router = useRouter();
  const status = getExpiryStatus(item.expiresAt, warnDays);
  const lifecycle = (item.status ?? "in_stock") as PantryLifecycleStatus;
  const isNotInStock = lifecycle !== "in_stock";
  const stockSignal = getPantryStockSignal(item);

  const { execute: execMarkOpened } = useAction(markOpenedAction, {
    onSuccess: () => { toast.success("Marked as opened"); router.refresh(); },
    onError: () => toast.error("Failed to update"),
  });

  const { execute: execDelete } = useAction(deletePantryItemAction, {
    onSuccess: () => {
      toast.success("Item removed");
      onDeleted?.(item.id);
    },
    onError: () => toast.error("Failed to remove item"),
  });

  const { execute: execStatus } = useAction(updatePantryStatusAction, {
    onSuccess: () => { toast.success("Status updated"); router.refresh(); },
    onError: () => toast.error("Failed to update status"),
  });

  const qtyLabel = item.unit ? `${item.quantity} ${item.unit}` : `×${item.quantity}`;

  return (
    <div className={cn("flex items-center gap-3 h-14 px-4 hover:bg-base-50 group", isNotInStock && "opacity-60")}>
      {/* Icon */}
      <div className="h-8 w-8 rounded flex-shrink-0 bg-base-100 flex items-center justify-center">
        <Archive className="h-4 w-4 text-base-400" />
      </div>

      {/* Name + meta */}
      <Link href={`/pantry/${item.id}`} className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={cn("text-sm font-medium truncate", isNotInStock ? "text-base-500 line-through" : "text-base-800")}>{item.name}</span>
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

      {/* Lifecycle status badge */}
      {lifecycle !== "in_stock" && (
        <Badge variant={lifecycleStatusVariant[lifecycle]} className="hidden sm:inline-flex">
          {lifecycleStatusLabel[lifecycle]}
        </Badge>
      )}

      {/* Expiry badge */}
      {lifecycle === "in_stock" && (
        <Badge variant={statusVariant[status]} className="hidden sm:inline-flex">
          {statusLabel[status]}
        </Badge>
      )}

      {stockSignal === "low" && lifecycle === "in_stock" && (
        <div className="hidden md:block">
          <RestockButton pantryItemId={item.id} name={item.name} quantity={item.quantity} unit={item.unit} compact />
        </div>
      )}

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
          {!item.openedAt && lifecycle === "in_stock" && (
            <DropdownMenuItem onClick={() => execMarkOpened({ id: item.id })}>
              <PackageOpen className="h-3.5 w-3.5 mr-2" />
              Mark as opened
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => execStatus({ id: item.id, status: "consumed" })}>
            <CheckCircle className="h-3.5 w-3.5 mr-2" />
            Mark consumed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => execStatus({ id: item.id, status: "discarded" })}>
            <XCircle className="h-3.5 w-3.5 mr-2" />
            Mark discarded
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => execStatus({ id: item.id, status: "out_of_stock" })}>
            <AlertCircle className="h-3.5 w-3.5 mr-2" />
            Out of stock
          </DropdownMenuItem>
          {lifecycle !== "in_stock" && (
            <DropdownMenuItem onClick={() => execStatus({ id: item.id, status: "in_stock" })}>
              <Archive className="h-3.5 w-3.5 mr-2" />
              Back in stock
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
