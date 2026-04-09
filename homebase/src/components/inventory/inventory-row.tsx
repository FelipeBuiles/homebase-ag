"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompletenessBar } from "./completeness-bar";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface InventoryRowProps {
  item: {
    id: string;
    name: string;
    brand?: string | null;
    condition: string;
    quantity: number;
    rooms: string[];
    tags: string[];
    completeness: number;
    attachments: { url: string }[];
  };
  onDelete: (id: string) => void;
}

const conditionVariant: Record<string, "success" | "warning" | "danger"> = {
  good: "success",
  fair: "warning",
  poor: "danger",
};

export function InventoryRow({ item, onDelete }: InventoryRowProps) {
  const router = useRouter();
  const thumb = item.attachments[0];

  return (
    <div className="flex items-center gap-3 h-14 px-4 hover:bg-base-50 group">
      {/* Thumbnail or icon */}
      <div className="h-8 w-8 rounded flex-shrink-0 overflow-hidden bg-base-100 flex items-center justify-center">
        {thumb ? (
          <Image
            src={thumb.url}
            alt={item.name}
            width={32}
            height={32}
            className="object-cover w-full h-full"
          />
        ) : (
          <Package className="h-4 w-4 text-base-400" />
        )}
      </div>

      {/* Name + meta */}
      <Link href={`/inventory/${item.id}`} className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-sm font-medium text-base-800 truncate">
            {item.name}
          </span>
          {item.brand && (
            <span className="text-xs text-base-400 truncate hidden sm:block">
              {item.brand}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.rooms[0] && (
            <span className="text-xs text-base-500">{item.rooms[0]}</span>
          )}
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs text-base-400 bg-base-100 px-1.5 py-0.5 rounded hidden sm:block"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>

      {/* Completeness */}
      <CompletenessBar value={item.completeness} className="hidden md:flex" />

      {/* Condition badge */}
      <Badge
        variant={conditionVariant[item.condition] ?? "default"}
        className="hidden sm:inline-flex"
      >
        {item.condition}
      </Badge>

      {/* Qty */}
      <span className="text-xs text-base-500 tabular-nums w-6 text-right">
        ×{item.quantity}
      </span>

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
          <DropdownMenuItem onClick={() => router.push(`/inventory/${item.id}/edit`)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
