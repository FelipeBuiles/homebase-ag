"use client";

import { useState } from "react";
import { PantryRow } from "./pantry-row";

interface PantryItem {
  id: string;
  name: string;
  brand?: string | null;
  location?: string | null;
  quantity: number;
  unit?: string | null;
  expiresAt?: Date | null;
  openedAt?: Date | null;
  status?: string | null;
}

export function PantryListClient({
  items: initialItems,
  warnDays,
}: {
  items: PantryItem[];
  warnDays?: number;
}) {
  const [items, setItems] = useState(initialItems);

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="divide-y divide-base-100 rounded-xl border border-base-200 bg-white overflow-hidden">
      {items.map((item) => (
        <PantryRow
          key={item.id}
          item={item}
          warnDays={warnDays}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
