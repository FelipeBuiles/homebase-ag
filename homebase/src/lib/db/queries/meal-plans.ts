import { prisma } from "@/lib/db/client";

export async function listMealPlans() {
  return prisma.mealPlan.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { weekStart: "desc" },
  });
}

export async function getMealPlan(id: string) {
  return prisma.mealPlan.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          recipe: { select: { id: true, title: true, servings: true } },
        },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
      },
    },
  });
}

export async function createMealPlan(data: { name: string; weekStart: Date }) {
  return prisma.mealPlan.create({ data });
}

export async function deleteMealPlan(id: string) {
  return prisma.mealPlan.delete({ where: { id } });
}

export async function addMealPlanItem(data: {
  planId: string;
  recipeId: string;
  date: Date;
  mealType: string;
  servings?: number;
  notes?: string;
}) {
  return prisma.mealPlanItem.create({ data });
}

export async function removeMealPlanItem(id: string) {
  return prisma.mealPlanItem.delete({ where: { id } });
}

export async function duplicateMealPlan(data: {
  sourceId: string;
  name: string;
  weekStart: Date;
}) {
  const source = await prisma.mealPlan.findUnique({
    where: { id: data.sourceId },
    include: { items: true },
  });
  if (!source) throw new Error("Source plan not found");

  const dayShiftMs =
    data.weekStart.getTime() - source.weekStart.getTime();
  const MS_PER_DAY = 86_400_000;
  const dayShift = Math.round(dayShiftMs / MS_PER_DAY);

  return prisma.mealPlan.create({
    data: {
      name: data.name,
      weekStart: data.weekStart,
      items: {
        create: source.items.map((item) => ({
          recipeId: item.recipeId,
          date: new Date(item.date.getTime() + dayShift * MS_PER_DAY),
          mealType: item.mealType,
          servings: item.servings,
          notes: item.notes,
        })),
      },
    },
  });
}

export async function getMealPlanForExport(id: string) {
  return prisma.mealPlan.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          recipe: {
            include: {
              ingredients: true,
            },
          },
        },
      },
    },
  });
}
