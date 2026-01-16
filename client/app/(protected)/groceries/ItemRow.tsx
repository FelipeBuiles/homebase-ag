'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toggleItemCheck, deleteItem } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GroceryItem } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function GroceryItemRow({ item }: { item: GroceryItem }) {
    const router = useRouter();
    const [checked, setChecked] = useState(item.isChecked);

    const handleCheck = async (val: boolean) => {
        setChecked(val); // Optimistic update
        await toggleItemCheck(item.id, val);
        router.refresh();
    };

    const handleDelete = async () => {
        await deleteItem(item.id);
        router.refresh();
    };

    return (
        <div className="flex items-center justify-between p-3 bg-card/80 rounded-2xl border border-border/60 mb-2 group shadow-soft">
            <div className="flex items-center gap-3">
                <Checkbox 
                    id={`item-${item.id}`} 
                    checked={checked} 
                    onCheckedChange={handleCheck}
                />
                <div className={checked ? "text-muted-foreground line-through" : ""}>
                    <div className="flex items-center gap-2">
                        <label htmlFor={`item-${item.id}`} className="font-medium cursor-pointer block">
                            {item.name}
                        </label>
                        {item.source && (
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                {item.source}
                            </Badge>
                        )}
                    </div>
                    {item.normalizedName && item.normalizedName !== item.name && (
                        <span className="text-xs text-muted-foreground">Normalized: {item.normalizedName}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{item.quantity} {item.category}</span>
                </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={handleDelete} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 size={16} />
            </Button>
        </div>
    );
}
