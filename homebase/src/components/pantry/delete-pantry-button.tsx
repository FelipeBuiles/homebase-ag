"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { deletePantryItemAction } from "@/actions/pantry";
import { toast } from "sonner";

export function DeletePantryButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useAction(deletePantryItemAction, {
    onSuccess: () => {
      toast.success("Item removed");
      router.push("/pantry");
    },
    onError: () => toast.error("Failed to remove item"),
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Remove
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from pantry?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-base-600">
            <strong>{itemName}</strong> will be permanently removed from your pantry.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => execute({ id: itemId })}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
