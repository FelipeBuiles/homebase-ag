"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { GroceryItem } from "@prisma/client";
import { GroceryItemRow } from "./ItemRow";
import { QuickActions, type GroceryFilters } from "./QuickActions";

type GroceriesListClientProps = {
  items: GroceryItem[];
};

export function GroceriesListClient({ items }: GroceriesListClientProps) {
  const [filters, setFilters] = useState<GroceryFilters>({ status: "all", source: "all" });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.status === "remaining" && item.isChecked) return false;
      if (filters.status === "checked" && !item.isChecked) return false;
      if (filters.source !== "all" && item.source !== filters.source) return false;
      return true;
    });
  }, [items, filters]);

  return (
    <div className="space-y-4">
      <QuickActions items={items} filters={filters} onFilterChange={setFilters} />
      <div className="space-y-1">
        {filteredItems.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No items match the current filters.
            </CardContent>
          </Card>
        )}
        {filteredItems.map((item) => (
          <GroceryItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
