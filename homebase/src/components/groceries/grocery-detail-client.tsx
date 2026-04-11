"use client";

import { useState, useRef } from "react";
import { useAction } from "next-safe-action/hooks";
import { Plus, X, Wand2, Loader2, Trash2, Copy, Merge } from "lucide-react";
import {
  addGroceryItemAction,
  removeGroceryItemAction,
  toggleGroceryItemAction,
  normalizeListAction,
  deleteGroceryListAction,
  checkDuplicatesAction,
  mergeDuplicatesAction,
} from "@/actions/groceries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { parseGrocerySource } from "@/lib/grocery-source";
import { useI18n } from "@/components/i18n-provider";

interface GroceryItem {
  id: string;
  name: string;
  normalizedName: string | null;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
  source: string;
  canonicalKey: string | null;
}

interface DuplicateGroup {
  canonicalKey: string;
  items: GroceryItem[];
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
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [input, setInput] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { execute: execAdd, isPending: adding } = useAction(addGroceryItemAction, {
    onSuccess: ({ data }) => {
      if (data?.item) {
        setItems((prev) => [...prev, data.item as GroceryItem]);
      }
      setInput("");
      inputRef.current?.focus();
    },
    onError: () => toast.error(t("groceries.detail.addFailed")),
  });

  const { execute: execRemove } = useAction(removeGroceryItemAction, {
    onError: () => toast.error(t("groceries.detail.removeFailed")),
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
    onError: () => toast.error(t("groceries.detail.updateFailed")),
  });

  const { execute: execNormalize, isPending: normalizing } = useAction(normalizeListAction, {
    onSuccess: () => toast.success(t("groceries.detail.normalizeQueued")),
    onError: () => toast.error(t("groceries.detail.normalizeFailed")),
  });

  const { execute: execDelete, isPending: deleting } = useAction(deleteGroceryListAction, {
    onSuccess: () => {
      toast.success(t("groceries.detail.listDeleted"));
      router.push("/groceries");
    },
    onError: () => toast.error(t("groceries.detail.deleteListFailed")),
  });

  const { execute: execCheckDupes, isPending: checkingDupes } = useAction(checkDuplicatesAction, {
    onSuccess: ({ data }) => {
      if (data?.groups && data.groups.length > 0) {
        setDuplicates(data.groups as DuplicateGroup[]);
        toast.info(t("groceries.detail.duplicatesFound", { count: data.groups.length }));
      } else {
        setDuplicates([]);
        toast.success(t("groceries.detail.noDuplicates"));
      }
    },
    onError: () => toast.error(t("groceries.detail.checkDuplicatesFailed")),
  });

  const { execute: execMerge } = useAction(mergeDuplicatesAction, {
    onSuccess: () => {
      toast.success(t("groceries.detail.itemsMerged"));
      setDuplicates([]);
      router.refresh();
    },
    onError: () => toast.error(t("groceries.detail.mergeFailed")),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    execAdd({ listId, name: trimmed });
  }

  function handleDelete() {
    if (confirm(t("groceries.detail.confirmDelete", { name: listName }))) {
      execDelete({ id: listId });
    }
  }

  function handleMerge(keepId: string, mergeIds: string[]) {
    setItems((prev) => prev.filter((i) => !mergeIds.includes(i.id)));
    execMerge({ keepId, mergeIds, listId });
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const generatedCount = unchecked.filter((item) => item.source && item.source !== "manual").length;

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
          {normalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {t("groceries.detail.normalize")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execCheckDupes({ listId })}
          disabled={checkingDupes || items.length === 0}
        >
          {checkingDupes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          {t("groceries.detail.checkDuplicates")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-danger hover:text-danger border-danger/20 hover:bg-danger/5"
        >
          <Trash2 className="h-4 w-4" />
          {t("groceries.detail.deleteList")}
        </Button>
      </div>

      {/* Duplicate groups */}
      {duplicates.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-warning">
            <Merge className="h-4 w-4" />
            {t("groceries.detail.duplicatesFound", { count: duplicates.length })}
          </div>
          {duplicates.map((group) => (
            <div key={group.canonicalKey} className="flex items-center gap-2 flex-wrap">
              {group.items.map((item, i) => (
                <span key={item.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleMerge(item.id, group.items.filter((g) => g.id !== item.id).map((g) => g.id))}
                    className="text-xs px-2 py-1 rounded border border-base-200 bg-white hover:bg-accent-50 hover:border-accent-300 transition-colors"
                  >
                    {item.name}
                    {i === 0 && <span className="ml-1 text-accent-600">{t("groceries.detail.keep")}</span>}
                  </button>
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Inline add input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("groceries.detail.addPlaceholder")}
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !input.trim()} size="sm">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t("groceries.detail.add")}
        </Button>
      </form>

      {/* Item list */}
      {items.length === 0 ? (
        <p className="text-sm text-base-400 text-center py-8">
          {t("groceries.detail.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {generatedCount > 0 && (
            <div className="rounded-lg border border-base-200 bg-base-50 px-4 py-3">
              <p className="text-sm text-base-700">
                {t("groceries.detail.generatedSummary", { count: generatedCount })}
              </p>
              <p className="text-xs text-base-500 mt-1">
                {t("groceries.detail.generatedDetail")}
              </p>
            </div>
          )}

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
                {t("groceries.detail.checkedOff")}
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
  const { t } = useI18n();
  const displayName = item.normalizedName ?? item.name;
  const hasNormalized = item.normalizedName && item.normalizedName !== item.name;
  const sourceInfo = parseGrocerySource(item.source);
  const detailText = sourceInfo.kind === "recipe"
    ? t("groceries.source.recipe", { name: sourceInfo.detailName ?? "" })
    : sourceInfo.kind === "recipe-missing"
      ? t("groceries.source.recipeMissing", { name: sourceInfo.detailName ?? "" })
      : sourceInfo.kind === "meal-plan"
        ? t("groceries.source.mealPlan", { name: sourceInfo.detailName ?? "" })
        : sourceInfo.kind === "meal-plan-missing"
          ? t("groceries.source.mealPlanMissing", { name: sourceInfo.detailName ?? "" })
          : sourceInfo.kind === "pantry-restock"
            ? t("groceries.source.pantryRestock", { name: sourceInfo.detailName ?? "" })
            : null;
  const badgeText = sourceInfo.kind === "recipe"
    ? t("groceries.badge.recipe")
    : sourceInfo.kind === "recipe-missing"
      ? t("groceries.badge.recipeMissing")
      : sourceInfo.kind === "meal-plan"
        ? t("groceries.badge.mealPlan")
        : sourceInfo.kind === "meal-plan-missing"
          ? t("groceries.badge.mealPlanMissing")
          : sourceInfo.kind === "pantry-restock"
            ? t("groceries.badge.pantryRestock")
            : sourceInfo.label;

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
        <div className="min-w-0">
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
        {detailText && (
          <p className="text-xs text-base-400 mt-0.5 truncate">{detailText}</p>
        )}
      </div>

      {/* Source badge */}
      {badgeText && (
        <Badge variant="agent" className="text-xs shrink-0">{badgeText}</Badge>
      )}

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
