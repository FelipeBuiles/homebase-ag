"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { deleteGroceryListAction } from "@/actions/groceries";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface GroceryListCardProps {
  list: {
    id: string;
    name: string;
    createdAt: Date;
    _count: { items: number };
    items: { id: string }[]; // unchecked items
  };
  onDeleted: (id: string) => void;
}

export function GroceryListCard({ list, onDeleted }: GroceryListCardProps) {
  const unchecked = list.items.length;
  const total = list._count.items;

  const { execute: execDelete, isPending } = useAction(deleteGroceryListAction, {
    onSuccess: () => {
      toast.success("List deleted");
      onDeleted(list.id);
    },
    onError: () => toast.error("Failed to delete list"),
  });

  return (
    <div className="flex items-center gap-3 h-14 px-4 hover:bg-base-50 group rounded-xl border border-base-200 bg-white">
      <div className="h-8 w-8 rounded flex-shrink-0 bg-base-100 flex items-center justify-center">
        <ShoppingCart className="h-4 w-4 text-base-400" />
      </div>

      <Link href={`/groceries/${list.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-base-800 truncate">{list.name}</p>
        <p className="text-xs text-base-400 mt-0.5">
          {unchecked === 0
            ? total === 0 ? "Empty" : "All done"
            : `${unchecked} item${unchecked === 1 ? "" : "s"} remaining`}
          {" · "}
          {formatDate(list.createdAt)}
        </p>
      </Link>

      {total > 0 && (
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="h-1.5 w-16 rounded-full bg-base-100 overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all"
              style={{ width: total > 0 ? `${((total - unchecked) / total) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-xs text-base-400 tabular-nums">
            {total - unchecked}/{total}
          </span>
        </div>
      )}

      <button
        onClick={() => {
          if (confirm(`Delete "${list.name}"?`)) execDelete({ id: list.id });
        }}
        disabled={isPending}
        className="h-7 w-7 flex items-center justify-center rounded text-base-300 hover:text-danger hover:bg-base-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
