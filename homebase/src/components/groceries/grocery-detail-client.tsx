"use client";

import { useState, useRef } from "react";
import { useAction } from "next-safe-action/hooks";
import { Plus, X, Wand2, Loader2, Trash2 } from "lucide-react";
import {
  addGroceryItemAction,
  removeGroceryItemAction,
  toggleGroceryItemAction,
  normalizeListAction,
  deleteGroceryListAction,
} from "@/actions/groceries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface GroceryItem {
  id: string;
  name: string;
  normalizedName: string | null;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
}

interface GroceryDetailClientProps {
  listId: string;
  listName: string;
  initialItems: GroceryItem[];
}

export function GroceryDetailClient({
  listId,
  listName,
  initialItems,
}: GroceryDetailClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { execute: execAdd, isPending: adding } = useAction(addGroceryItemAction, {
    onSuccess: ({ data }) => {
      if (data?.item) {
        setItems((prev) => [...prev, data.item as GroceryItem]);
      }
      setInput("");
      inputRef.current?.focus();
    },
    onError: () => toast.error("Failed to add item"),
  });

  const { execute: execRemove } = useAction(removeGroceryItemAction, {
    onError: () => toast.error("Failed to remove item"),
  });

  function handleRemove(id: string, listId: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    execRemove({ id, listId });
  }

  const { execute: execToggle } = useAction(toggleGroceryItemAction, {
    onSuccess: ({ data }) => {
      if (data?.item) {
        const updated = data.item as GroceryItem;
        setItems((prev) =>
          prev.map((i) => (i.id === updated.id ? { ...i, checked: updated.checked } : i))
        );
      }
    },
    onError: () => toast.error("Failed to update item"),
  });

  const { execute: execNormalize, isPending: normalizing } = useAction(normalizeListAction, {
    onSuccess: () => toast.success("Normalization queued — check Review for suggestions"),
    onError: () => toast.error("Failed to queue normalization"),
  });

  const { execute: execDelete, isPending: deleting } = useAction(deleteGroceryListAction, {
    onSuccess: () => {
      toast.success("List deleted");
      router.push("/groceries");
    },
    onError: () => toast.error("Failed to delete list"),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    execAdd({ listId, name: trimmed });
  }

  function handleDelete() {
    if (confirm(`Delete "${listName}"?`)) {
      execDelete({ id: listId });
    }
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => execNormalize({ listId })}
          disabled={normalizing || items.length === 0}
        >
          {normalizing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Normalize list
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-danger hover:text-danger border-danger/20 hover:bg-danger/5"
        >
          <Trash2 className="h-4 w-4" />
          Delete list
        </Button>
      </div>

      {/* Inline add input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add an item..."
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !input.trim()} size="sm">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </form>

      {/* Item list */}
      {items.length === 0 ? (
        <p className="text-sm text-base-400 text-center py-8">
          No items yet — add something above.
        </p>
      ) : (
        <div className="rounded-xl border border-base-200 bg-white overflow-hidden divide-y divide-base-100">
          {unchecked.map((item) => (
            <GroceryItemRow
              key={item.id}
              item={item}
              listId={listId}
              onToggle={execToggle}
              onRemove={handleRemove}
            />
          ))}

          {checked.length > 0 && unchecked.length > 0 && (
            <div className="px-4 py-1.5 bg-base-50">
              <span className="text-xs text-base-400 font-medium uppercase tracking-wide">
                Checked off
              </span>
            </div>
          )}

          {checked.map((item) => (
            <GroceryItemRow
              key={item.id}
              item={item}
              listId={listId}
              onToggle={execToggle}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroceryItemRow({
  item,
  listId,
  onToggle,
  onRemove,
}: {
  item: GroceryItem;
  listId: string;
  onToggle: (args: { id: string; listId: string }) => void;
  onRemove: (id: string, listId: string) => void;
}) {
  const displayName = item.normalizedName ?? item.name;
  const hasNormalized = item.normalizedName && item.normalizedName !== item.name;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-50 group">
      {/* Checkbox */}
      <button
        onClick={() => onToggle({ id: item.id, listId })}
        className={cn(
          "h-4 w-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
          item.checked
            ? "bg-accent-500 border-accent-500 text-white"
            : "border-base-300 hover:border-accent-400"
        )}
      >
        {item.checked && (
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 10 10">
            <path
              d="M1.5 5.5L4 8l4.5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm",
            item.checked ? "line-through text-base-400" : "text-base-800"
          )}
        >
          {displayName}
        </span>
        {hasNormalized && (
          <span className="ml-2 text-xs text-base-400 line-through">{item.name}</span>
        )}
        {(item.quantity || item.unit) && (
          <span className="ml-2 text-xs text-base-500">
            {[item.quantity, item.unit].filter(Boolean).join(" ")}
          </span>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id, listId)}
        className="h-6 w-6 flex items-center justify-center rounded text-base-300 hover:text-danger hover:bg-base-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
