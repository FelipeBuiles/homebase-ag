"use client";

import { useAction } from "next-safe-action/hooks";
import { deleteItem } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteItemDialogProps {
  itemId: string | null;
  itemName?: string;
  onClose: () => void;
  redirectOnDelete?: boolean;
}

export function DeleteItemDialog({
  itemId,
  itemName,
  onClose,
  redirectOnDelete,
}: DeleteItemDialogProps) {
  const router = useRouter();
  const { execute, isPending } = useAction(deleteItem, {
    onSuccess: () => {
      toast.success("Item deleted");
      onClose();
      if (redirectOnDelete) router.push("/inventory");
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  });

  return (
    <Dialog open={!!itemId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogTitle>Delete item</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete{" "}
          <span className="font-medium text-base-800">{itemName ?? "this item"}</span>?
          This cannot be undone.
        </DialogDescription>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => itemId && execute({ id: itemId })}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
