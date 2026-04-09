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
}) {
  return prisma.mealPlanItem.create({ data });
}

export async function removeMealPlanItem(id: string) {
  return prisma.mealPlanItem.delete({ where: { id } });
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
