'use server';

import prisma from "@/lib/prisma";
import { inventoryQueue } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeCategory, normalizeField, normalizeLocation } from "@/lib/inventory";

export async function createInventoryItem(formData: FormData) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = normalizeLocation(formData.get("location"));
    const category = normalizeCategory(formData.get("category"));

    if (!name) return;

    const item = await prisma.inventoryItem.create({
        data: {
            name,
            description,
            location,
            category,
            tags: [],
        },
    });

    // Trigger Agent
    await inventoryQueue.add("created", {
        itemId: item.id,
        name: item.name,
    });

    revalidatePath("/inventory");
    redirect("/inventory");
}

export async function quickAddInventoryItem(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name) return;

    const item = await prisma.inventoryItem.create({
        data: {
            name,
            description: null,
            location: null,
            category: null,
            tags: [],
        },
    });

    await inventoryQueue.add("created", {
        itemId: item.id,
        name: item.name,
    });

    revalidatePath("/inventory");
    redirect(`/inventory/${item.id}?quick=1`);
}

export async function updateInventoryItem(itemId: string, formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string | null) ?? "";
    const location = normalizeLocation(formData.get("location"));
    const category = normalizeCategory(formData.get("category"));

    if (!name) return;

    await prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
            name,
            description: description.trim() ? description : null,
            location,
            category,
        },
    });

    revalidatePath(`/inventory/${itemId}`);
    revalidatePath("/inventory");
    redirect(`/inventory/${itemId}`);
}

export async function deleteInventoryItem(itemId: string) {
    await prisma.inventoryItem.delete({
        where: { id: itemId },
    });
    revalidatePath("/inventory");
    redirect("/inventory");
}
