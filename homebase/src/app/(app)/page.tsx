import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock3,
  Package,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeDate } from "@/lib/utils";
import { getDashboardData, getMonday } from "@/lib/db/queries/dashboard";
import { getI18n } from "@/lib/i18n/server";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default async function DashboardPage() {
  const [data, { t, locale }] = await Promise.all([getDashboardData(), getI18n()]);
  const today = new Date();
  const todayStr = today.toDateString();
  const monday = getMonday(today);
  const dayLabels = DAY_KEYS.map((key) => t(`dashboard.days.${key}`));

  const todayMeals = data.currentWeekPlan
    ? data.currentWeekPlan.items.filter((item) => new Date(item.date).toDateString() === todayStr)
    : [];

  const nextCookSuggestion =
    data.cookFromPantry.useSoon[0] ??
    data.cookFromPantry.cookNow[0] ??
    data.cookFromPantry.almostThere[0] ??
    null;

  return (
    <PageShell title={t("pages.home.title")}>
      <div className="space-y-6">
        <div className="surface-illustrated warm-glow rounded-[2rem] border border-[rgba(123,89,64,0.12)] px-5 py-5 md:px-6 md:py-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:items-stretch">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[rgba(123,89,64,0.1)] bg-white/70 text-base-700 hover:bg-white/70">
                  {t("dashboard.nextStep.eyebrow")}
                </Badge>
                {nextCookSuggestion?.coverage.cookNow && <Badge variant="success">{t("dashboard.cookNow")}</Badge>}
              </div>
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-base-900 md:text-[2.5rem]">
                  {nextCookSuggestion
                    ? t("dashboard.nextStep.cook", { title: nextCookSuggestion.title })
                    : data.uncheckedGroceryCount > 0
                      ? t("dashboard.nextStep.reviewGroceries")
                      : t("dashboard.nextStep.buildFromPantry")}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-base-600 md:text-[0.98rem]">
                  {nextCookSuggestion
                    ? nextCookSuggestion.coverage.expiringMatchCount > 0
                      ? t("dashboard.nextStep.expiringHelp", { count: nextCookSuggestion.coverage.expiringMatchCount })
                      : nextCookSuggestion.coverage.missingIngredientCount > 0
                        ? t("dashboard.nextStep.matchedHelp", { count: nextCookSuggestion.coverage.coveredIngredientCount + nextCookSuggestion.coverage.partialIngredientCount, total: nextCookSuggestion.coverage.ingredientCount })
                        : t("dashboard.nextStep.coveredHelp")
                    : data.currentWeekPlan
                      ? t("dashboard.nextStep.inMotion")
                      : t("dashboard.nextStep.noPlan")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {nextCookSuggestion ? (
                  <>
                    <Button size="sm" className="shadow-[0_14px_28px_rgba(171,86,52,0.26)]" nativeButton={false} render={<Link href={`/recipes/${nextCookSuggestion.recipeId}`} />}>
                      {t("dashboard.actions.viewRecipe")}
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white/72" nativeButton={false} render={<Link href="/pantry" />}>
                      {t("dashboard.actions.openPantry")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" className="shadow-[0_14px_28px_rgba(171,86,52,0.26)]" nativeButton={false} render={<Link href="/meal-plans" />}>
                      {t("dashboard.actions.openMealPlans")}
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white/72" nativeButton={false} render={<Link href="/recipes" />}>
                      {t("dashboard.actions.browseRecipes")}
                    </Button>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat href="/pantry" icon={<Package className="h-4 w-4" />} value={data.pantryCount} label={t("dashboard.stats.pantryItems")} />
                <MiniStat href={`/groceries/${data.groceryList.id}`} icon={<ShoppingCart className="h-4 w-4" />} value={data.uncheckedGroceryCount} label={t("dashboard.stats.toBuy")} />
                <MiniStat href="/recipes" icon={<BookOpen className="h-4 w-4" />} value={data.recipeCount} label={t("dashboard.stats.recipes")} />
                <MiniStat href="/review" icon={<ClipboardList className="h-4 w-4" />} value={data.pendingProposals} label={t("dashboard.stats.pendingReview")} />
              </div>
            </div>
            <div className="paper-panel relative overflow-hidden rounded-[1.8rem] border border-[rgba(123,89,64,0.1)] p-5 shadow-[0_20px_42px_rgba(92,67,46,0.08)]">
              <div className="relative">
                <div className="rounded-[1.5rem] border border-[rgba(123,89,64,0.1)] bg-white/70 p-4 shadow-[0_16px_30px_rgba(92,67,46,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-base-500">{t("dashboard.thisWeek.title")}</p>
                  <div className="mt-4 grid grid-cols-7 gap-1.5">
                    {dayLabels.map((label, i) => {
                      const d = new Date(monday);
                      d.setDate(d.getDate() + i);
                      const isToday = d.toDateString() === todayStr;
                      const count = data.currentWeekPlan
                        ? data.currentWeekPlan.items.filter(
                            (item) => new Date(item.date).toDateString() === d.toDateString()
                          ).length
                        : 0;

                      return (
                        <div
                          key={`${label}-hero`}
                          className={cn(
                            "rounded-xl py-2 text-center",
                            isToday
                              ? "bg-[linear-gradient(180deg,rgba(200,109,71,0.95),rgba(171,86,52,0.98))] text-white shadow-[0_16px_28px_rgba(171,86,52,0.24)]"
                              : "bg-base-50/70 text-base-600"
                          )}
                        >
                          <p className="text-[10px] font-medium uppercase leading-none mb-1">{label}</p>
                          <p className="text-sm font-display font-semibold tabular-nums">{count > 0 ? count : "\u2013"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 rounded-[1.4rem] border border-[rgba(123,89,64,0.1)] bg-white/72 p-4">
                  <div className="grid grid-cols-3 gap-2">
                    <MiniMetric
                      label={t("dashboard.thisWeek.cookable")}
                      value={`${data.weekPantrySummary?.fullyCoveredMealCount ?? 0}/${data.weekPantrySummary?.plannedMealCount ?? 0}`}
                    />
                    <MiniMetric
                      label={t("dashboard.thisWeek.useSoon")}
                      value={String(data.weekPantrySummary?.mealsUsingExpiringItems ?? 0)}
                    />
                    <MiniMetric
                      label={t("dashboard.thisWeek.missing")}
                      value={String(data.weekPantrySummary?.uniqueMissingIngredients.length ?? 0)}
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-base-400 mb-2">{t("dashboard.thisWeek.today")}</p>
                    {todayMeals.length === 0 ? (
                      <p className="text-sm text-base-500">{t("dashboard.thisWeek.noMealsToday")}</p>
                    ) : (
                      <div className="space-y-1">
                        {todayMeals.slice(0, 3).map((item) => (
                          <Link
                            key={`${item.id}-hero`}
                            href={`/recipes/${item.recipeId}`}
                            className="flex items-center gap-2 py-1 text-sm text-base-700 hover:text-accent-600 transition-colors"
                          >
                            <span className="w-16 shrink-0 text-xs text-base-400">{item.mealType}</span>
                            <span className="truncate">{item.recipe.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4">
          <Card className="paper-panel">
            <CardHeader>
              <CardTitle>{t("dashboard.attention.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PriorityTile
                  href={data.expiringCount > 0 ? "/pantry?tab=expiring" : "/pantry"}
                  icon={<Clock3 className="h-4 w-4" />}
                  eyebrow={t("dashboard.priority.useSoon")}
                  value={String(data.expiringCount)}
                  label={t("dashboard.priority.expiringItems")}
                  tone={data.expiringCount > 0 ? "warning" : "neutral"}
                />
                <PriorityTile
                  href={data.lowStockItems.length > 0 ? "/pantry" : `/groceries/${data.groceryList.id}`}
                  icon={<Package className="h-4 w-4" />}
                  eyebrow={t("dashboard.priority.restock")}
                  value={String(data.lowStockItems.length)}
                  label={t("dashboard.priority.runningLow")}
                  tone={data.lowStockItems.length > 0 ? "warning" : "neutral"}
                />
                <PriorityTile
                  href={data.pendingProposals > 0 ? "/review" : "/review"}
                  icon={<ClipboardList className="h-4 w-4" />}
                  eyebrow={t("dashboard.priority.decide")}
                  value={String(data.pendingProposals)}
                  label={t("dashboard.priority.pendingReviews")}
                  tone={data.pendingProposals > 0 ? "danger" : "neutral"}
                />
              </div>

              <div className="rounded-[1.4rem] border border-[rgba(123,89,64,0.1)] bg-white/78 p-4 shadow-[0_18px_36px_rgba(92,67,46,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-base-400">{t("dashboard.nextStep.eyebrow")}</p>
                    <h2 className="text-lg font-display font-semibold text-base-900 mt-1">
                      {nextCookSuggestion
                        ? t("dashboard.nextStep.cook", { title: nextCookSuggestion.title })
                        : data.uncheckedGroceryCount > 0
                          ? t("dashboard.nextStep.reviewGroceries")
                          : t("dashboard.nextStep.buildFromPantry")}
                    </h2>
                  </div>
                  {nextCookSuggestion?.coverage.cookNow && (
                    <Badge variant="success">{t("dashboard.cookNow")}</Badge>
                  )}
                </div>

                <p className="text-sm text-base-600 mt-2">
                  {nextCookSuggestion
                    ? nextCookSuggestion.coverage.expiringMatchCount > 0
                      ? t("dashboard.nextStep.expiringHelp", { count: nextCookSuggestion.coverage.expiringMatchCount })
                      : nextCookSuggestion.coverage.missingIngredientCount > 0
                        ? t("dashboard.nextStep.matchedHelp", { count: nextCookSuggestion.coverage.coveredIngredientCount + nextCookSuggestion.coverage.partialIngredientCount, total: nextCookSuggestion.coverage.ingredientCount })
                        : t("dashboard.nextStep.coveredHelp")
                    : data.currentWeekPlan
                      ? t("dashboard.nextStep.inMotion")
                      : t("dashboard.nextStep.noPlan")}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {nextCookSuggestion ? (
                    <>
                      <Button size="sm" nativeButton={false} render={<Link href={`/recipes/${nextCookSuggestion.recipeId}`} />}>
                        {t("dashboard.actions.viewRecipe")}
                      </Button>
                      <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/pantry" />}>
                        {t("dashboard.actions.openPantry")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" nativeButton={false} render={<Link href="/meal-plans" />}>
                        {t("dashboard.actions.openMealPlans")}
                      </Button>
                      <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/recipes" />}>
                        {t("dashboard.actions.browseRecipes")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="paper-panel">
            <CardHeader>
              <CardTitle>{t("dashboard.thisWeek.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!data.currentWeekPlan ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-base-500">{t("dashboard.thisWeek.noPlan")}</p>
                  <Button size="sm" className="mt-3" nativeButton={false} render={<Link href="/meal-plans" />}>
                    {t("dashboard.thisWeek.createPlan")}
                  </Button>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-7 gap-1">
                    {dayLabels.map((label, i) => {
                      const d = new Date(monday);
                      d.setDate(d.getDate() + i);
                      const isToday = d.toDateString() === todayStr;
                      const count = data.currentWeekPlan!.items.filter(
                        (item) => new Date(item.date).toDateString() === d.toDateString()
                      ).length;

                      return (
                        <div
                          key={label}
                          className={cn(
                            "rounded-xl py-2 text-center transition-transform duration-300 hover:-translate-y-0.5",
                            isToday
                              ? "bg-[linear-gradient(180deg,rgba(200,109,71,0.95),rgba(171,86,52,0.98))] text-white shadow-[0_16px_28px_rgba(171,86,52,0.24)]"
                              : "bg-white/72 text-base-600"
                          )}
                        >
                          <p className="text-[10px] font-medium uppercase leading-none mb-1">{label}</p>
                          <p className="text-sm font-display font-semibold tabular-nums">{count > 0 ? count : "\u2013"}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <MiniMetric
                      label={t("dashboard.thisWeek.cookable")}
                      value={`${data.weekPantrySummary?.fullyCoveredMealCount ?? 0}/${data.weekPantrySummary?.plannedMealCount ?? 0}`}
                    />
                    <MiniMetric
                      label={t("dashboard.thisWeek.useSoon")}
                      value={String(data.weekPantrySummary?.mealsUsingExpiringItems ?? 0)}
                    />
                    <MiniMetric
                      label={t("dashboard.thisWeek.missing")}
                      value={String(data.weekPantrySummary?.uniqueMissingIngredients.length ?? 0)}
                    />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-base-400 mb-2">{t("dashboard.thisWeek.today")}</p>
                    {todayMeals.length === 0 ? (
                      <p className="text-sm text-base-500">{t("dashboard.thisWeek.noMealsToday")}</p>
                    ) : (
                      <div className="space-y-1">
                        {todayMeals.map((item) => (
                          <Link
                            key={item.id}
                            href={`/recipes/${item.recipeId}`}
                            className="flex items-center gap-2 py-1 text-sm text-base-700 hover:text-accent-600 transition-colors"
                          >
                            <span className="text-xs text-base-400 w-16 shrink-0">{item.mealType}</span>
                            <span className="truncate">{item.recipe.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link href={`/meal-plans/${data.currentWeekPlan.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline">
                    {t("dashboard.thisWeek.open")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="paper-panel">
            <CardHeader>
              <CardTitle>{t("dashboard.cookNext.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...data.cookFromPantry.useSoon, ...data.cookFromPantry.cookNow].slice(0, 3).length === 0 ? (
                <p className="text-sm text-base-500">{t("dashboard.cookNext.empty")}</p>
              ) : (
                [...data.cookFromPantry.useSoon, ...data.cookFromPantry.cookNow].slice(0, 3).map((recipe) => (
                  <Link
                    key={recipe.recipeId}
                    href={`/recipes/${recipe.recipeId}`}
                    className="block rounded-[1.2rem] border border-[rgba(123,89,64,0.1)] bg-white/72 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_32px_rgba(92,67,46,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-base-800 truncate">{recipe.title}</p>
                        <p className="text-xs text-base-500 mt-1">
                          {recipe.coverage.cookNow
                          ? t("dashboard.cookNext.covered")
                            : t("dashboard.cookNext.matched", { count: recipe.coverage.coveredIngredientCount + recipe.coverage.partialIngredientCount, total: recipe.coverage.ingredientCount })}
                        </p>
                      </div>
                      {recipe.coverage.expiringMatchCount > 0 && (
                        <Badge variant="warning" className="shrink-0">{t("dashboard.priority.useSoon")}</Badge>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="paper-panel">
            <CardHeader>
              <CardTitle>{t("dashboard.buyNext.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.weekPantrySummary?.uniqueMissingIngredients.length ?? 0) > 0 ? (
                <>
                  <p className="text-sm text-base-600">
                    {t("dashboard.buyNext.planNeeds", { count: data.weekPantrySummary!.uniqueMissingIngredients.length })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.weekPantrySummary!.uniqueMissingIngredients.slice(0, 6).map((ingredient) => (
                      <span key={ingredient.key} className="rounded-full border border-[rgba(123,89,64,0.1)] bg-white/78 px-2.5 py-1 text-xs text-base-700 shadow-[0_8px_18px_rgba(92,67,46,0.04)]">
                        {ingredient.name}
                      </span>
                    ))}
                  </div>
                  <Button size="sm" nativeButton={false} render={<Link href={`/meal-plans/${data.currentWeekPlan!.id}`} />}>
                    {t("dashboard.buyNext.openShortages")}
                  </Button>
                </>
              ) : data.uncheckedGroceryCount > 0 ? (
                <>
                  <p className="text-sm text-base-600">
                    {t("dashboard.buyNext.waiting", { count: data.uncheckedGroceryCount })}
                  </p>
                  <div className="space-y-1">
                    {data.topGroceryItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-base-700">
                        <div className="h-1.5 w-1.5 rounded-full bg-base-300 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" nativeButton={false} render={<Link href={`/groceries/${data.groceryList.id}`} />}>
                    {t("dashboard.buyNext.openList")}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-base-500">{t("dashboard.buyNext.none")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="paper-panel">
            <CardHeader>
              <CardTitle>{t("dashboard.reviewNext.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pendingProposals === 0 ? (
                <p className="text-sm text-base-500">{t("dashboard.reviewNext.none")}</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <ReviewRow label={t("nav.pantry")} count={data.proposalCounts.pantry ?? 0} />
                    <ReviewRow label={t("nav.groceries")} count={data.proposalCounts["grocery-item"] ?? 0} />
                    <ReviewRow label={t("nav.mealPlans")} count={data.proposalCounts["meal-plan"] ?? 0} />
                    <ReviewRow label={t("nav.recipes")} count={data.proposalCounts.recipe ?? 0} />
                    <ReviewRow label={t("nav.inventory")} count={data.proposalCounts.inventory ?? 0} />
                  </div>
                  <Button size="sm" nativeButton={false} render={<Link href="/review" />}>
                    {t("dashboard.reviewNext.open")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="paper-panel">
            <CardHeader>
              <CardTitle>{t("dashboard.pantrySignals.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.expiringItems.length === 0 && data.lowStockItems.length === 0 ? (
                <p className="text-sm text-base-500">{t("dashboard.pantrySignals.none")}</p>
              ) : (
                <>
                  {data.expiringItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/pantry/${item.id}`}
                      className="flex items-center gap-3 rounded-[1.15rem] border border-[rgba(123,89,64,0.1)] bg-white/72 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_28px_rgba(92,67,46,0.06)]"
                    >
                      <TriangleAlert className="h-4 w-4 text-warning shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-base-800 truncate">{item.name}</p>
                        <p className="text-xs text-base-500">{formatRelativeDate(item.expiresAt!, locale)}</p>
                      </div>
                    </Link>
                  ))}
                  {data.lowStockItems.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={`/pantry/${item.id}`}
                      className="flex items-center gap-3 rounded-[1.15rem] border border-[rgba(123,89,64,0.1)] bg-white/72 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_28px_rgba(92,67,46,0.06)]"
                    >
                      <Package className="h-4 w-4 text-base-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-base-800 truncate">{item.name}</p>
                        <p className="text-xs text-base-500">
                          {item.unit ? t("dashboard.pantrySignals.leftWithUnit", { quantity: item.quantity, unit: item.unit }) : t("dashboard.pantrySignals.left", { quantity: item.quantity })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="paper-panel">
            <CardHeader>
              <CardTitle>{t("dashboard.activity.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-base-500 py-2">{t("dashboard.activity.none")}</p>
              ) : (
                <div className="space-y-2">
                  {data.recentActivity.map((log) => {
                    const style = {
                      dot:
                        log.action === "proposal.accepted"
                          ? "bg-success"
                          : log.action === "proposal.rejected"
                            ? "bg-danger"
                            : log.action === "proposal.created"
                              ? "bg-warning"
                              : log.action === "proposal.change.accepted"
                                ? "bg-success"
                                : log.action === "job.failed"
                                  ? "bg-danger"
                                  : "bg-base-300",
                      label:
                        log.action === "proposal.accepted"
                          ? t("dashboard.activity.accepted")
                          : log.action === "proposal.rejected"
                            ? t("dashboard.activity.rejected")
                            : log.action === "proposal.created"
                              ? t("dashboard.activity.proposed")
                              : log.action === "proposal.change.accepted"
                                ? t("dashboard.activity.fieldApplied")
                                : log.action === "job.failed"
                                  ? t("dashboard.activity.failed")
                                  : log.action,
                    };
                    return (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", style.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm text-base-800">{style.label}</span>
                            <span className="text-xs text-base-400">{t("dashboard.activity.by", { actor: log.actor })}</span>
                          </div>
                          <p className="text-xs text-base-400 mt-0.5">{formatRelativeDate(log.createdAt, locale)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </PageShell>
  );
}

function PriorityTile({
  href,
  icon,
  eyebrow,
  value,
  label,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  label: string;
  tone: "warning" | "danger" | "neutral";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-[1.35rem] border bg-white/76 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_34px_rgba(92,67,46,0.08)]",
        tone === "warning" ? "border-warning/30" : tone === "danger" ? "border-danger/30" : "border-[rgba(123,89,64,0.1)]"
      )}
    >
      <div className="flex items-center gap-2 text-base-400">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{eyebrow}</span>
      </div>
      <p className="mt-3 text-2xl font-display font-semibold text-base-900">{value}</p>
      <p className="text-xs text-base-500 mt-1">{label}</p>
    </Link>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(123,89,64,0.08)] bg-white/72 px-3 py-2 shadow-[0_10px_22px_rgba(92,67,46,0.04)]">
      <p className="text-[10px] uppercase tracking-wide text-base-400">{label}</p>
      <p className="text-sm font-medium text-base-800">{value}</p>
    </div>
  );
}

function ReviewRow({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-base-600">{label}</span>
      <span className="font-medium text-base-900">{count}</span>
    </div>
  );
}

function MiniStat({
  href,
  icon,
  value,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Link href={href} className="rounded-[1.35rem] border border-[rgba(123,89,64,0.1)] bg-white/78 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_34px_rgba(92,67,46,0.08)]">
      <div className="flex items-center gap-2 text-base-400">
        {icon}
        <span className="text-xs text-base-500">{label}</span>
      </div>
      <p className="mt-3 text-xl font-display font-semibold text-base-900 tabular-nums">{value}</p>
    </Link>
  );
}
