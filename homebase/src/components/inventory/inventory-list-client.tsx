"use client";

import { useState } from "react";
import { InventoryRow } from "./inventory-row";
import { DeleteItemDialog } from "./delete-item-dialog";

interface Item {
  id: string;
  name: string;
  brand?: string | null;
  condition: string;
  quantity: number;
  rooms: string[];
  tags: string[];
  completeness: number;
  attachments: { url: string }[];
}

interface InventoryListClientProps {
  items: Item[];
}

export function InventoryListClient({ items }: InventoryListClientProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <div className="divide-y divide-base-100 rounded-lg border border-base-200 bg-white overflow-hidden">
        {items.map((item) => (
          <InventoryRow
            key={item.id}
            item={item}
            onDelete={(id) =>
              setDeleteTarget({ id, name: item.name })
            }
          />
        ))}
      </div>

      <DeleteItemDialog
        itemId={deleteTarget?.id ?? null}
        itemName={deleteTarget?.name}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
