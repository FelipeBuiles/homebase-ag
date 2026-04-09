"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Plus, X, Sparkles, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import {
  addMealPlanItemAction,
  removeMealPlanItemAction,
  exportToGroceriesAction,
  triggerChefAgentAction,
  deleteMealPlanAction,
} from "@/actions/meal-plans";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

interface MealPlanItem {
  id: string;
  date: Date;
  mealType: string;
  servings: number;
  recipe: { id: string; title: string; servings: number | null };
}

interface Recipe {
  id: string;
  title: string;
}

interface WeekGridClientProps {
  planId: string;
  planName: string;
  weekStart: Date;
  initialItems: MealPlanItem[];
  recipes: Recipe[];
}

export function WeekGridClient({
  planId,
  planName,
  weekStart,
  initialItems,
  recipes,
}: WeekGridClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [addSlot, setAddSlot] = useState<{ dayOffset: number; mealType: string } | null>(null);

  const { execute: execAdd, isPending: adding } = useAction(addMealPlanItemAction, {
    onSuccess: ({ data }) => {
      if (data?.item) {
        // Re-fetch by refreshing — simpler than manually reconstructing with recipe data
        router.refresh();
      }
      setAddSlot(null);
    },
    onError: () => toast.error("Failed to add recipe"),
  });

  const { execute: execRemoveBase } = useAction(removeMealPlanItemAction, {
    onError: () => toast.error("Failed to remove recipe"),
  });

  function execRemove(args: { id: string; planId: string }) {
    setItems((prev) => prev.filter((i) => i.id !== args.id));
    execRemoveBase(args);
  }

  const { execute: execChef, isPending: chefPending } = useAction(triggerChefAgentAction, {
    onSuccess: () => toast.success("Chef agent queued — check Review for suggestions"),
    onError: () => toast.error("Failed to queue chef agent"),
  });

  const { execute: execExport, isPending: exporting } = useAction(exportToGroceriesAction, {
    onError: () => toast.error("Failed to export to groceries"),
  });

  const { execute: execDelete, isPending: deleting } = useAction(deleteMealPlanAction, {
    onSuccess: () => {
      toast.success("Plan deleted");
      router.push("/meal-plans");
    },
    onError: () => toast.error("Failed to delete plan"),
  });

  // Build slot map: `${dayOffset}-${mealType}` → items[]
  const slotMap = new Map<string, MealPlanItem[]>();
  for (const item of items) {
    const d = new Date(item.date);
    const offset = (d.getDay() + 6) % 7; // Mon=0
    const key = `${offset}-${item.mealType}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key)!.push(item);
  }

  function getSlotDate(dayOffset: number): string {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => execChef({ planId })}
          disabled={chefPending}
        >
          {chefPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Suggest meals
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execExport({ planId })}
          disabled={exporting || items.length === 0}
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          Export to groceries
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => confirm(`Delete "${planName}"?`) && execDelete({ id: planId })}
          disabled={deleting}
          className="ml-auto text-danger hover:text-danger border-danger/20 hover:bg-danger/5"
        >
          <Trash2 className="h-4 w-4" />
          Delete plan
        </Button>
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header row */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1">
            <div />
            {DAYS.map((day, i) => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + i);
              return (
                <div key={day} className="text-center">
                  <p className="text-xs font-semibold text-base-700">{day}</p>
                  <p className="text-xs text-base-400">{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Meal type rows */}
          {MEAL_TYPES.map((mealType) => (
            <div key={mealType} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1">
              <div className="flex items-start justify-end pr-2 pt-1.5">
                <span className="text-xs text-base-400 font-medium">{mealType}</span>
              </div>
              {DAYS.map((_, dayOffset) => {
                const key = `${dayOffset}-${mealType}`;
                const slotItems = slotMap.get(key) ?? [];
                return (
                  <div
                    key={dayOffset}
                    className="min-h-[52px] rounded-lg border border-base-200 bg-white p-1 space-y-1"
                  >
                    {slotItems.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-start gap-1 rounded bg-accent-50 border border-accent-100 px-1.5 py-1"
                      >
                        <span className="text-xs text-accent-700 leading-tight flex-1 min-w-0 truncate">
                          {item.recipe.title}
                        </span>
                        <button
                          onClick={() => execRemove({ id: item.id, planId })}
                          className="text-accent-300 hover:text-accent-600 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setAddSlot({ dayOffset, mealType })}
                      className={cn(
                        "w-full flex items-center justify-center rounded text-base-300 hover:text-accent-500 hover:bg-base-50 transition-colors",
                        slotItems.length === 0 ? "h-8" : "h-5"
                      )}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add recipe dialog */}
      <Dialog open={!!addSlot} onOpenChange={(o) => !o && setAddSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add recipe —{" "}
              {addSlot
                ? `${DAYS[addSlot.dayOffset]} ${addSlot.mealType}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          {recipes.length === 0 ? (
            <p className="text-sm text-base-500 py-2">
              No parsed recipes yet. Import some recipes first.
            </p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  disabled={adding}
                  onClick={() => {
                    if (!addSlot) return;
                    execAdd({
                      planId,
                      recipeId: recipe.id,
                      date: getSlotDate(addSlot.dayOffset),
                      mealType: addSlot.mealType,
                      servings: 2,
                    });
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-base-700 hover:bg-base-50 rounded-lg transition-colors"
                >
                  {recipe.title}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
