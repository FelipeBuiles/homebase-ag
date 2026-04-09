"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, ExternalLink, Pencil, Trash2, MoreHorizontal, Clock, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface RecipeRowProps {
  recipe: {
    id: string;
    title: string;
    sourceUrl?: string | null;
    prepMinutes?: number | null;
    cookMinutes?: number | null;
    parseStatus: string;
    _count: { ingredients: number };
  };
  onDelete: (id: string) => void;
}

const statusBadge: Record<string, { variant: "warning" | "success" | "danger"; icon: React.ReactNode; label: string }> = {
  pending: { variant: "warning", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Parsing…" },
  parsed:  { variant: "success", icon: null, label: "Parsed" },
  failed:  { variant: "danger",  icon: <AlertTriangle className="h-3 w-3" />, label: "Failed" },
};

export function RecipeRow({ recipe, onDelete }: RecipeRowProps) {
  const router = useRouter();
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const status = statusBadge[recipe.parseStatus] ?? statusBadge.pending;

  return (
    <div className="flex items-center gap-3 h-14 px-4 hover:bg-base-50 group">
      <div className="h-8 w-8 rounded bg-base-100 flex items-center justify-center shrink-0">
        <ChefHat className="h-4 w-4 text-base-400" />
      </div>

      <Link href={`/recipes/${recipe.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-base-800 truncate">{recipe.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {totalMinutes > 0 && (
            <span className="flex items-center gap-1 text-xs text-base-400">
              <Clock className="h-3 w-3" />
              {totalMinutes}m
            </span>
          )}
          {recipe._count.ingredients > 0 && (
            <span className="text-xs text-base-400">
              {recipe._count.ingredients} ingredients
            </span>
          )}
          {recipe.sourceUrl && (
            <span className="text-xs text-base-400 truncate hidden sm:block">
              {new URL(recipe.sourceUrl).hostname.replace("www.", "")}
            </span>
          )}
        </div>
      </Link>

      <Badge variant={status.variant} className="hidden sm:inline-flex gap-1 items-center">
        {status.icon}
        {status.label}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded text-base-400 hover:text-base-700 hover:bg-base-100",
            "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/recipes/${recipe.id}/edit`)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
          {recipe.sourceUrl && (
            <DropdownMenuItem onClick={() => window.open(recipe.sourceUrl!, "_blank")}>
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Open source
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(recipe.id)}>
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
