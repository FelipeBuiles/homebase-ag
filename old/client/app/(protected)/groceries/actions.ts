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

export async function mergeGroceryItems(formData: FormData) {
    const targetId = formData.get("targetId") as string;
    const sourceIds = formData.getAll("sourceIds").map(String);

    if (!targetId || sourceIds.length === 0) return;

    await prisma.$transaction(async (tx) => {
        const target = await tx.groceryItem.findUnique({ where: { id: targetId } });
        if (!target) return;

        const sources = await tx.groceryItem.findMany({
            where: { id: { in: sourceIds } },
        });

        if (sources.length === 0) return;

        const mergedFrom = [
            ...(Array.isArray(target.mergedFrom) ? target.mergedFrom : []),
            ...sources.map((source) => ({
                id: source.id,
                name: source.name,
                normalizedName: source.normalizedName,
                quantity: source.quantity,
            })),
        ];

        await tx.groceryItem.update({
            where: { id: targetId },
            data: { mergedFrom },
        });

        await tx.groceryItem.deleteMany({
            where: { id: { in: sourceIds } },
        });
    });

    revalidatePath("/groceries");
}

export async function clearCheckedItems() {
    const list = await getOrCreateDefaultGroceryList();
    await prisma.groceryItem.deleteMany({
        where: { listId: list.id, isChecked: true },
    });
    revalidatePath("/groceries");
}

export async function clearAllItems() {
    const list = await getOrCreateDefaultGroceryList();
    await prisma.groceryItem.deleteMany({
        where: { listId: list.id },
    });
    revalidatePath("/groceries");
}
