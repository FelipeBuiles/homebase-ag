"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { deleteRecipeAction } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export function DeleteRecipeButton({ recipeId, recipeTitle }: { recipeId: string; recipeTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useAction(deleteRecipeAction, {
    onSuccess: () => {
      toast.success("Recipe deleted");
      router.push("/recipes");
    },
    onError: () => toast.error("Failed to delete recipe"),
  });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-danger hover:text-danger hover:bg-danger/10">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Delete recipe</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium text-base-800">{recipeTitle}</span>? This cannot be undone.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" disabled={isPending} onClick={() => execute({ id: recipeId })}>
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
