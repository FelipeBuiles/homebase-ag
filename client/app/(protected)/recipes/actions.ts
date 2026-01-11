'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRecipe(formData: FormData) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const instructions = formData.get("instructions") as string;
    const sourceUrl = formData.get("sourceUrl") as string;
    const ingredientsRaw = formData.get("ingredients") as string;

    if (!name) return;

    // Process ingredients (simple newline split)
    const ingredientsData = ingredientsRaw.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            // Very basic parsing: try to separate first word as quantity/unit if possible, or just treat whole line as name for now
            // A real parser is complex. We'll just store the whole line as name + quantity combined for MVP simplicity, 
            // or try a naive split.
            return {
                name: line,
                quantity: "",
                unit: ""
            };
        });

    const recipe = await prisma.recipe.create({
        data: {
            name,
            description,
            instructions,
            sourceUrl: sourceUrl || null,
            ingredients: {
                create: ingredientsData
            }
        },
    });

    // Future: Trigger Recipe Parser Agent if sourceUrl is present

    revalidatePath("/recipes");
    redirect(`/recipes/${recipe.id}`);
}

export async function deleteRecipe(id: string) {
    await prisma.recipe.delete({ where: { id } });
    revalidatePath("/recipes");
    redirect("/recipes");
}
