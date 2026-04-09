'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMealPlan(formData: FormData) {
    const startDateStr = formData.get("startDate") as string;

    // Ensure Monday
    const date = new Date(startDateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));

    const plan = await prisma.mealPlan.create({
        data: {
            startDate: monday
        }
    });

    revalidatePath("/meal-plans");
    redirect(`/meal-plans/${plan.id}`);
}

export async function assignRecipeToSlot(planId: string, date: Date, mealType: string, recipeId: string) {
    await prisma.mealPlanItem.create({
        data: {
            planId,
            date,
            mealType,
            recipeId
        }
    });
    revalidatePath(`/meal-plans/${planId}`);
}

export async function removeSlot(itemId: string) {
    // Need to find planId before deleting to revalidate
    const item = await prisma.mealPlanItem.findUnique({ where: { id: itemId } });
    if (item) {
        await prisma.mealPlanItem.delete({ where: { id: itemId } });
        revalidatePath(`/meal-plans/${item.planId}`);
    }
}
