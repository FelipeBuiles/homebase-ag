"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteItemDialog } from "./delete-item-dialog";

export function DeleteButtonClient({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-danger hover:text-danger hover:bg-danger/10">
        <Trash2 className="h-4 w-4" />
      </Button>
      <DeleteItemDialog
        itemId={open ? itemId : null}
        itemName={itemName}
        onClose={() => setOpen(false)}
        redirectOnDelete
      />
    </>
  );
}
