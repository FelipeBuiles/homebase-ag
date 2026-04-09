"use client";

import { useState } from "react";
import { GroceryListCard } from "./grocery-list-card";

interface GroceryList {
  id: string;
  name: string;
  createdAt: Date;
  _count: { items: number };
  items: { id: string }[];
}

export function GroceryListIndexClient({ lists: initial }: { lists: GroceryList[] }) {
  const [lists, setLists] = useState(initial);

  return (
    <div className="space-y-2">
      {lists.map((list) => (
        <GroceryListCard
          key={list.id}
          list={list}
          onDeleted={(id) => setLists((prev) => prev.filter((l) => l.id !== id))}
        />
      ))}
    </div>
  );
}
