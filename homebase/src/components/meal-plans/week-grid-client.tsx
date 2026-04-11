"use client";

import { useState, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import {
  Plus,
  X,
  Sparkles,
  ShoppingCart,
  Trash2,
  Loader2,
  Copy,
  Search,
} from "lucide-react";
import {
  addMealPlanItemAction,
  removeMealPlanItemAction,
  exportToGroceriesAction,
  triggerChefAgentAction,
  deleteMealPlanAction,
  duplicateMealPlanAction,
} from "@/actions/meal-plans";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MealPlanPantrySummary } from "@/lib/meal-plans/pantry-summary";
import { useI18n } from "@/components/i18n-provider";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

function asDate(value: Date | string) {
  return new Date(value);
}

function addUtcDays(date: Date | string, days: number) {
  const next = asDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getUtcDayOffset(date: Date | string) {
  const value = asDate(date);
  return (value.getUTCDay() + 6) % 7; // Mon=0
}

function nextMonday(date: Date | string): Date {
  const d = asDate(date);
  const day = d.getUTCDay();
  const diff = day === 1 ? 7 : ((1 + 7 - day) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function toISODateString(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

interface MealPlanItem {
  id: string;
  date: Date | string;
  mealType: string;
  servings: number;
  recipe: { id: string; title: string; servings: number | null };
}

interface Recipe {
  id: string;
  title: string;
  servings: number | null;
  coverage?: {
    ingredientCount: number;
    coveredIngredientCount: number;
    partialIngredientCount: number;
    missingIngredientCount: number;
    expiringMatchCount: number;
    cookNow: boolean;
    usesExpiring: boolean;
  } | null;
}

interface WeekGridClientProps {
  planId: string;
  planName: string;
  weekStart: Date | string;
  initialItems: MealPlanItem[];
  recipes: Recipe[];
  pantrySummary: MealPlanPantrySummary;
}

export function WeekGridClient({
  planId,
  planName,
  weekStart,
  initialItems,
  recipes,
  pantrySummary,
}: WeekGridClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const dayLabels = DAY_KEYS.map((key) => t(`dashboard.days.${key}`));
  const [items, setItems] = useState(initialItems);
  const [addSlot, setAddSlot] = useState<{
    dayOffset: number;
    mealType: string;
  } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");

  // Ref to track current optimistic temp ID for swap-on-success
  const pendingTempId = useRef<string | null>(null);
  const optimisticIdCounter = useRef(0);

  // Duplicate dialog state
  const [dupOpen, setDupOpen] = useState(false);
  const [dupName, setDupName] = useState("");
  const [dupWeekStart, setDupWeekStart] = useState("");

  // --- Actions ---

  const { execute: execAdd } = useAction(addMealPlanItemAction, {
    onSuccess: ({ data }) => {
      if (data?.item && pendingTempId.current) {
        const tempId = pendingTempId.current;
        setItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: data.item!.id } : i))
        );
        pendingTempId.current = null;
      }
    },
    onError: () => {
      if (pendingTempId.current) {
        const tempId = pendingTempId.current;
        setItems((prev) => prev.filter((i) => i.id !== tempId));
        pendingTempId.current = null;
      }
      toast.error(t("mealPlans.grid.addFailed"));
    },
  });

  const { execute: execRemoveBase } = useAction(removeMealPlanItemAction, {
    onError: () => toast.error(t("mealPlans.grid.removeFailed")),
  });

  function execRemove(args: { id: string; planId: string }) {
    setItems((prev) => prev.filter((i) => i.id !== args.id));
    execRemoveBase(args);
  }

  const { execute: execChef, isPending: chefPending } = useAction(
    triggerChefAgentAction,
    {
      onSuccess: () =>
        toast.success(t("mealPlans.grid.chefQueued")),
      onError: () => toast.error(t("mealPlans.grid.chefFailed")),
    }
  );

  const { execute: execExport, isPending: exporting } = useAction(
    exportToGroceriesAction,
    {
      onError: () => toast.error(t("mealPlans.grid.exportFailed")),
    }
  );

  const { execute: execDelete, isPending: deleting } = useAction(
    deleteMealPlanAction,
    {
      onSuccess: () => {
        toast.success(t("mealPlans.grid.deleted"));
        router.push("/meal-plans");
      },
      onError: () => toast.error(t("mealPlans.grid.deleteFailed")),
    }
  );

  const { execute: execDuplicate, isPending: duplicating } = useAction(
    duplicateMealPlanAction,
    {
      onSuccess: ({ data }) => {
        if (data?.plan) {
          toast.success(t("mealPlans.grid.duplicated"));
          router.push(`/meal-plans/${data.plan.id}`);
        }
      },
      onError: () => toast.error(t("mealPlans.grid.duplicateFailed")),
    }
  );

  // --- Helpers ---

  const slotMap = new Map<string, MealPlanItem[]>();
  for (const item of items) {
    const offset = getUtcDayOffset(item.date);
    const key = `${offset}-${item.mealType}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key)!.push(item);
  }

  function getSlotDate(dayOffset: number): string {
    const d = addUtcDays(weekStart, dayOffset);
    return d.toISOString();
  }

  // --- Optimistic add ---

  function handleAddRecipe(recipe: Recipe) {
    if (!addSlot) return;
    optimisticIdCounter.current += 1;
    const tempId = `temp-${optimisticIdCounter.current}`;
    pendingTempId.current = tempId;

    // Immediately insert optimistic item
    const optimisticItem: MealPlanItem = {
      id: tempId,
      date: getSlotDate(addSlot.dayOffset),
      mealType: addSlot.mealType,
      servings: recipe.servings ?? 2,
      recipe: { id: recipe.id, title: recipe.title, servings: recipe.servings },
    };
    setItems((prev) => [...prev, optimisticItem]);

    // Close dialog immediately
    setAddSlot(null);
    setRecipeSearch("");

    // Fire action in background — onSuccess/onError handles swap/remove
    execAdd({
      planId,
      recipeId: recipe.id,
      date: getSlotDate(addSlot.dayOffset),
      mealType: addSlot.mealType,
      servings: recipe.servings ?? 2,
    });
  }

  // --- Duplicate ---

  function openDuplicate() {
    setDupName(`${planName} (copy)`);
    const next = nextMonday(weekStart);
    setDupWeekStart(toISODateString(next));
    setDupOpen(true);
  }

  function handleDuplicate() {
    if (!dupName.trim() || !dupWeekStart) return;
    execDuplicate({
      sourceId: planId,
      name: dupName.trim(),
      weekStart: dupWeekStart,
    });
    setDupOpen(false);
  }

  // --- Filtered recipes for dialog ---

  const filteredRecipes = (recipeSearch.trim()
    ? recipes.filter((r) =>
        r.title.toLowerCase().includes(recipeSearch.toLowerCase())
      )
    : recipes
  ).sort((a, b) => {
    const aCoverage = a.coverage;
    const bCoverage = b.coverage;
    if ((bCoverage?.cookNow ? 1 : 0) !== (aCoverage?.cookNow ? 1 : 0)) {
      return (bCoverage?.cookNow ? 1 : 0) - (aCoverage?.cookNow ? 1 : 0);
    }
    if ((bCoverage?.expiringMatchCount ?? 0) !== (aCoverage?.expiringMatchCount ?? 0)) {
      return (bCoverage?.expiringMatchCount ?? 0) - (aCoverage?.expiringMatchCount ?? 0);
    }
    if ((bCoverage?.coveredIngredientCount ?? 0) !== (aCoverage?.coveredIngredientCount ?? 0)) {
      return (bCoverage?.coveredIngredientCount ?? 0) - (aCoverage?.coveredIngredientCount ?? 0);
    }
    if ((bCoverage?.partialIngredientCount ?? 0) !== (aCoverage?.partialIngredientCount ?? 0)) {
      return (bCoverage?.partialIngredientCount ?? 0) - (aCoverage?.partialIngredientCount ?? 0);
    }
    if ((aCoverage?.missingIngredientCount ?? 0) !== (bCoverage?.missingIngredientCount ?? 0)) {
      return (aCoverage?.missingIngredientCount ?? 0) - (bCoverage?.missingIngredientCount ?? 0);
    }
    return a.title.localeCompare(b.title);
  });

  // --- Grid: days as rows, meals as columns for denser full-week plans ---

  const GRID_COLS = "grid-cols-[84px_repeat(3,minmax(0,1fr))]";

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
          {chefPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {t("mealPlans.grid.suggestMeals")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execExport({ planId })}
          disabled={exporting || items.length === 0}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {t("mealPlans.grid.exportMissing")}
        </Button>
        <Button variant="outline" size="sm" onClick={openDuplicate}>
          <Copy className="h-4 w-4" />
          {t("mealPlans.grid.duplicate")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            confirm(t("mealPlans.grid.confirmDelete", { name: planName })) && execDelete({ id: planId })
          }
          disabled={deleting}
          className="ml-auto text-danger hover:text-danger border-danger/20 hover:bg-danger/5"
        >
          <Trash2 className="h-4 w-4" />
          {t("mealPlans.grid.deletePlan")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-base-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wide text-base-400">{t("mealPlans.grid.cookableMeals")}</p>
          <p className="text-2xl font-display font-semibold text-base-900">
            {pantrySummary.fullyCoveredMealCount}
            <span className="ml-1 text-sm font-sans text-base-500">/ {pantrySummary.plannedMealCount}</span>
          </p>
          <p className="mt-1 text-xs text-base-500">{t("mealPlans.grid.cookableMealsHelp")}</p>
        </div>
        <div className="rounded-xl border border-base-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wide text-base-400">{t("mealPlans.grid.useSoon")}</p>
          <p className="text-2xl font-display font-semibold text-warning">
            {pantrySummary.mealsUsingExpiringItems}
          </p>
          <p className="mt-1 text-xs text-base-500">{t("mealPlans.grid.useSoonHelp")}</p>
        </div>
        <div className="rounded-xl border border-base-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wide text-base-400">{t("mealPlans.grid.missingIngredients")}</p>
          <p className="text-2xl font-display font-semibold text-base-900">
            {pantrySummary.uniqueMissingIngredients.length}
          </p>
          <p className="mt-1 text-xs text-base-500">{t("mealPlans.grid.missingIngredientsHelp")}</p>
        </div>
      </div>

      {pantrySummary.uniqueMissingIngredients.length > 0 && (
        <div className="rounded-xl border border-base-200 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-base-800">{t("mealPlans.grid.weeklyShortages")}</h2>
              <p className="text-xs text-base-500">{t("mealPlans.grid.weeklyShortagesHelp")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pantrySummary.uniqueMissingIngredients.map((ingredient) => (
              <span
                key={ingredient.key}
                className="rounded-full border border-base-200 bg-base-50 px-2.5 py-1 text-xs text-base-700"
              >
                {ingredient.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="rounded-[1.2rem] border border-base-200 bg-white/80 p-3 md:p-4">
        <div className={`grid ${GRID_COLS} gap-2`}>
          <div />
          {MEAL_TYPES.map((mealType) => (
            <div
              key={mealType}
              className="rounded-xl bg-base-50/80 px-3 py-2 text-center"
            >
              <span className="text-xs font-medium text-base-500">
                {mealType === "Breakfast"
                  ? t("mealPlans.grid.breakfast")
                  : mealType === "Lunch"
                    ? t("mealPlans.grid.lunch")
                    : t("mealPlans.grid.dinner")}
              </span>
            </div>
          ))}

          {dayLabels.map((day, dayOffset) => {
            const d = addUtcDays(weekStart, dayOffset);

            return (
              <Fragment key={`${day}-${dayOffset}`}>
                <div className="flex flex-col justify-center rounded-xl bg-base-50/70 px-2 py-3 text-center">
                  <p className="text-xs font-semibold text-base-700">{day}</p>
                  <p className="text-xs text-base-400">{d.getUTCDate()}</p>
                </div>

                {MEAL_TYPES.map((mealType) => {
                  const key = `${dayOffset}-${mealType}`;
                  const slotItems = slotMap.get(key) ?? [];
                  const isEmpty = slotItems.length === 0;

                  return (
                    <div
                      key={key}
                      className={cn(
                        "min-h-[84px] rounded-xl p-2 space-y-1.5",
                        isEmpty
                          ? "border border-dashed border-base-300 bg-transparent"
                          : "border border-solid border-base-200 bg-white"
                      )}
                    >
                      {slotItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-1.5 rounded-lg border border-accent-100 bg-accent-50 px-2 py-1.5"
                        >
                          <Link
                            href={`/recipes/${item.recipe.id}`}
                            className="min-w-0 flex-1 text-xs leading-tight text-accent-700 hover:underline"
                          >
                            <span className="line-clamp-2">{item.recipe.title}</span>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              execRemove({ id: item.id, planId });
                            }}
                            className="flex-shrink-0 text-accent-400 hover:text-accent-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {isEmpty ? (
                        <button
                          onClick={() => setAddSlot({ dayOffset, mealType })}
                          className="flex h-10 w-full items-center justify-center gap-1 rounded-lg text-xs text-base-400 transition-colors hover:bg-base-50 hover:text-accent-500"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{t("mealPlans.grid.add")}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setAddSlot({ dayOffset, mealType })}
                          className="flex h-6 w-full items-center justify-center rounded text-base-300 transition-colors hover:bg-base-50 hover:text-accent-500"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Add recipe dialog */}
      <Dialog
        open={!!addSlot}
        onOpenChange={(o) => {
          if (!o) {
            setAddSlot(null);
            setRecipeSearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("mealPlans.grid.addRecipe")}{" "}
              {addSlot
                ? `${dayLabels[addSlot.dayOffset]} ${addSlot.mealType === "Breakfast" ? t("mealPlans.grid.breakfast") : addSlot.mealType === "Lunch" ? t("mealPlans.grid.lunch") : t("mealPlans.grid.dinner")}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          {recipes.length === 0 ? (
            <p className="text-sm text-base-500 py-2">
              {t("mealPlans.grid.noRecipes")}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-400" />
                <Input
                  placeholder={t("pages.recipes.searchPlaceholder")}
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredRecipes.length === 0 ? (
                  <p className="text-sm text-base-400 py-3 text-center">
                    {t("mealPlans.grid.noRecipeMatch")}
                  </p>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleAddRecipe(recipe)}
                      className="w-full text-left px-3 py-2 text-sm text-base-700 hover:bg-base-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate">{recipe.title}</p>
                          {recipe.coverage?.ingredientCount ? (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={cn(
                                "text-[10px] rounded-full px-1.5 py-0.5",
                                recipe.coverage.cookNow
                                  ? "bg-success/15 text-green-700"
                                  : "bg-base-100 text-base-600"
                              )}>
                                {recipe.coverage.cookNow
                                  ? t("mealPlans.grid.cookNow")
                                  : t("mealPlans.grid.matched", { count: recipe.coverage.coveredIngredientCount + recipe.coverage.partialIngredientCount, total: recipe.coverage.ingredientCount })}
                              </span>
                              {recipe.coverage.partialIngredientCount > 0 && (
                                <span className="text-[10px] rounded-full bg-warning/15 px-1.5 py-0.5 text-orange-700">
                                  {t("mealPlans.grid.partial", { count: recipe.coverage.partialIngredientCount })}
                                </span>
                              )}
                              {recipe.coverage.usesExpiring && (
                                <span className="text-[10px] rounded-full bg-warning/15 px-1.5 py-0.5 text-orange-700">
                                  {t("mealPlans.grid.usesExpiring", { count: recipe.coverage.expiringMatchCount })}
                                </span>
                              )}
                              {recipe.coverage.missingIngredientCount > 0 && (
                                <span className="text-[10px] text-base-500">
                                  {t("mealPlans.grid.missing", { count: recipe.coverage.missingIngredientCount })}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate plan dialog */}
      <Dialog open={dupOpen} onOpenChange={setDupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mealPlans.grid.duplicatePlan")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-base-600 mb-1 block">
                {t("mealPlans.createPlan.name")}
              </label>
              <Input
                value={dupName}
                onChange={(e) => setDupName(e.target.value)}
                placeholder={t("mealPlans.grid.planNamePlaceholder")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-base-600 mb-1 block">
                {t("mealPlans.createPlan.weekStart")}
              </label>
              <Input
                type="date"
                value={dupWeekStart}
                onChange={(e) => setDupWeekStart(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDupOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleDuplicate}
              disabled={duplicating || !dupName.trim() || !dupWeekStart}
            >
              {duplicating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {t("mealPlans.grid.duplicate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
