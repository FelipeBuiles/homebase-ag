'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPantryItem(formData: FormData) {
    const name = formData.get("name") as string;
    const quantity = formData.get("quantity") as string;
    const unit = formData.get("unit") as string;
    const expirationDateStr = formData.get("expirationDate") as string;
    const category = formData.get("category") as string;

    if (!name) return;

    await prisma.pantryItem.create({
        data: {
            name,
            quantity: quantity || null,
            unit: unit || null,
            category: category || null,
            expirationDate: expirationDateStr ? new Date(expirationDateStr) : null
        }
    });

    revalidatePath("/pantry");
    redirect("/pantry");
}

export async function deletePantryItem(id: string) {
    await prisma.pantryItem.delete({ where: { id } });
    revalidatePath("/pantry");
}
