"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { deleteRecipeAction } from "@/actions/recipes";
import { RecipeRow } from "./recipe-row";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Recipe {
  id: string;
  title: string;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  parseStatus: string;
  _count: { ingredients: number };
  coverage?: {
    ingredientCount: number;
    coveredIngredientCount: number;
    partialIngredientCount: number;
    missingIngredientCount: number;
    expiringMatchCount: number;
    cookNow: boolean;
    usesExpiring: boolean;
  } | null;
}

export function RecipeListClient({ recipes }: { recipes: Recipe[] }) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { execute, isPending } = useAction(deleteRecipeAction, {
    onSuccess: () => {
      toast.success("Recipe deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete recipe"),
  });

  return (
    <>
      <div className="divide-y divide-base-100 rounded-lg border border-base-200 bg-white overflow-hidden">
        {recipes.map((r) => (
          <RecipeRow
            key={r.id}
            recipe={r}
            onDelete={(id) => setDeleteTarget({ id, title: r.title })}
          />
        ))}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Delete recipe</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium text-base-800">{deleteTarget?.title}</span>? This cannot be undone.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" disabled={isPending} onClick={() => deleteTarget && execute({ id: deleteTarget.id })}>
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
