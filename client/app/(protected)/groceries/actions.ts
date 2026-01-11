'use server';

import prisma from "@/lib/prisma";
import { groceryQueue } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createGroceryList(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name) return;

    const list = await prisma.groceryList.create({
        data: { name },
    });

    revalidatePath("/groceries");
    redirect(`/groceries/${list.id}`);
}

export async function addItemToList(listId: string, formData: FormData) {
    const name = formData.get("name") as string;
    const quantity = formData.get("quantity") as string;

    if (!name) return;

    const item = await prisma.groceryItem.create({
        data: {
            name,
            quantity,
            listId,
            isChecked: false,
        },
    });

    // Trigger Normalization Agent
    await groceryQueue.add("created", {
        itemId: item.id,
        name: item.name,
        listId: listId
    });

    revalidatePath(`/groceries/${listId}`);
}

export async function toggleItemCheck(itemId: string, isChecked: boolean) {
    await prisma.groceryItem.update({
        where: { id: itemId },
        data: { isChecked },
    });

    // We need to know the listId to revalidate accurately, 
    // but for simplicity we can just return and let client handle or find the item first.
    // For now, let's just update.
}

export async function deleteItem(itemId: string) {
    await prisma.groceryItem.delete({
        where: { id: itemId }
    });
}
