import { prisma } from "@/lib/db/client";
import { getAppConfig } from "@/lib/db/queries/settings";
import { getDefaultGroceryList } from "@/lib/db/queries/groceries";
import { getCookFromPantrySections, getPantryCoverageForRecipes } from "@/lib/recipes/pantry-coverage";
import { getRunningLowPantryItems } from "@/lib/db/queries/pantry";
import { getPantryStockSignal } from "@/lib/pantry-utils";
import { buildMealPlanPantrySummary } from "@/lib/meal-plans/pantry-summary";

export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getDashboardData() {
  const [config, groceryList] = await Promise.all([
    getAppConfig(),
    getDefaultGroceryList(),
  ]);

  const warnDays = config.pantryWarnDays;
  const warnDate = new Date();
  warnDate.setDate(warnDate.getDate() + warnDays);

  const thisMonday = getMonday(new Date());
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const [
    pantryCount,
    expiringCount,
    expiringItems,
    runningLowItems,
    uncheckedGroceryCount,
    topGroceryItems,
    recipeCount,
    pendingProposals,
    pendingProposalGroups,
    currentWeekPlan,
    recentActivity,
    cookFromPantry,
  ] = await Promise.all([
    prisma.pantryItem.count({ where: { status: "in_stock" } }),
    prisma.pantryItem.count({
      where: { status: "in_stock", expiresAt: { lte: warnDate } },
    }),
    prisma.pantryItem.findMany({
      where: { status: "in_stock", expiresAt: { lte: warnDate } },
      orderBy: { expiresAt: "asc" },
      take: 5,
    }),
    getRunningLowPantryItems(),
    prisma.groceryItem.count({
      where: { listId: groceryList.id, checked: false },
    }),
    prisma.groceryItem.findMany({
      where: { listId: groceryList.id, checked: false },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.recipe.count(),
    prisma.proposal.count({ where: { status: "pending" } }),
    prisma.proposal.groupBy({
      by: ["entityType"],
      where: { status: "pending" },
      _count: { entityType: true },
    }),
    prisma.mealPlan.findFirst({
      where: { weekStart: { gte: thisMonday, lt: nextMonday } },
      include: {
        items: {
          include: {
            recipe: { select: { id: true, title: true } },
          },
          orderBy: [{ date: "asc" }, { mealType: "asc" }],
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getCookFromPantrySections(3),
  ]);

  const lowStockItems = runningLowItems
    .filter((item) => getPantryStockSignal(item) === "low")
    .slice(0, 5);

  const currentWeekRecipeIds = currentWeekPlan
    ? Array.from(new Set(currentWeekPlan.items.map((item) => item.recipe.id)))
    : [];
  const currentWeekCoverage = currentWeekRecipeIds.length > 0
    ? await getPantryCoverageForRecipes(currentWeekRecipeIds)
    : new Map();
  const weekPantrySummary = currentWeekPlan
    ? buildMealPlanPantrySummary(currentWeekPlan.items, currentWeekCoverage)
    : null;

  const proposalCounts = Object.fromEntries(
    pendingProposalGroups.map((group) => [group.entityType, group._count.entityType])
  );

  return {
    pantryCount,
    expiringCount,
    expiringItems,
    lowStockItems,
    uncheckedGroceryCount,
    topGroceryItems,
    recipeCount,
    pendingProposals,
    proposalCounts,
    currentWeekPlan,
    weekPantrySummary,
    recentActivity,
    warnDays,
    groceryList,
    cookFromPantry,
  };
}
