"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { clearAllItems, clearCheckedItems } from "./actions";
import type { GroceryItem } from "@prisma/client";

export type GroceryFilters = {
  status: "all" | "remaining" | "checked";
  source: "all" | "manual" | "recipe" | "agent";
};

type QuickActionsProps = {
  items: GroceryItem[];
  filters: GroceryFilters;
  onFilterChange: (filters: GroceryFilters) => void;
};

export function QuickActions({ items, filters, onFilterChange }: QuickActionsProps) {
  const counts = useMemo(() => {
    const remaining = items.filter((item) => !item.isChecked).length;
    const checked = items.filter((item) => item.isChecked).length;
    return { remaining, checked };
  }, [items]);

  const updateFilters = (next: Partial<GroceryFilters>) => {
    const updated = { ...filters, ...next };
    onFilterChange(updated);
  };

  const handleClearChecked = async () => {
    await clearCheckedItems();
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all grocery items?")) return;
    await clearAllItems();
  };

  const statusOptions: Array<{ key: GroceryFilters["status"]; label: string; count?: number }> = [
    { key: "all", label: "All" },
    { key: "remaining", label: `Remaining (${counts.remaining})` },
    { key: "checked", label: `Checked (${counts.checked})` },
  ];

  const sourceOptions: Array<{ key: GroceryFilters["source"]; label: string }> = [
    { key: "all", label: "All" },
    { key: "manual", label: "Manual" },
    { key: "recipe", label: "Recipe" },
    { key: "agent", label: "Agent" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Status</span>
        {statusOptions.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={filters.status === option.key ? "default" : "outline"}
            onClick={() => updateFilters({ status: option.key })}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Source</span>
        {sourceOptions.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={filters.source === option.key ? "default" : "outline"}
            onClick={() => updateFilters({ source: option.key })}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={handleClearChecked}>
          Clear checked
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={handleClearAll}>
          Clear all
        </Button>
      </div>
    </div>
  );
}
