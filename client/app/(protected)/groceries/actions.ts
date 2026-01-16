'use server';

import prisma from "@/lib/prisma";
import { groceryQueue } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { getOrCreateDefaultGroceryList } from "@/lib/groceries";

export async function addGroceryItem(formData: FormData) {
    const name = formData.get("name") as string;
    const quantity = formData.get("quantity") as string;

    if (!name) return;

    const list = await getOrCreateDefaultGroceryList();
    const item = await prisma.groceryItem.create({
        data: {
            name,
            quantity,
            listId: list.id,
            isChecked: false,
            source: "manual",
        },
    });

    // Trigger Normalization Agent
    await groceryQueue.add("created", {
        itemId: item.id,
        name: item.name,
        listId: list.id,
    });

    revalidatePath("/groceries");
}

export async function toggleItemCheck(itemId: string, isChecked: boolean) {
    await prisma.groceryItem.update({
        where: { id: itemId },
        data: { isChecked },
    });

    revalidatePath("/groceries");
}

export async function deleteItem(itemId: string) {
    await prisma.groceryItem.delete({
        where: { id: itemId }
    });

    revalidatePath("/groceries");
}
