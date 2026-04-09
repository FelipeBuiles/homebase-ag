"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createGroceryListAction } from "@/actions/groceries";
import { toast } from "sonner";

export function CreateListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { execute, isPending } = useAction(createGroceryListAction, {
    onSuccess: ({ data }) => {
      toast.success("List created");
      setOpen(false);
      setName("");
      router.push(`/groceries/${data?.list?.id}`);
    },
    onError: () => toast.error("Failed to create list"),
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New list
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create grocery list</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) execute({ name: name.trim() });
            }}
            className="space-y-4"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly shop, Party supplies..."
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
