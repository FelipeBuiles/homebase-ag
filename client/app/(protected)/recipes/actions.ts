'use server';

import prisma from "@/lib/prisma";
import { parseIngredientLine } from "@/lib/ingredients";
import { recipeQueue } from "@/lib/queue";
import { addRecipeIngredientsToGroceries } from "@/lib/recipes-to-groceries";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type CreateRecipeDraftInput = {
    sourceUrl: string;
};

export async function createRecipeDraft({ sourceUrl }: CreateRecipeDraftInput) {
    const recipe = await prisma.recipe.create({
        data: {
            name: "",
            sourceUrl,
            status: "draft",
            parsingStatus: "pending",
        },
    });

    await recipeQueue.add("parse", { recipeId: recipe.id, sourceUrl });
    return recipe;
}

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
        .map(line => parseIngredientLine(line));

    const recipe = await prisma.recipe.create({
        data: {
            name,
            description,
            instructions,
            sourceUrl: sourceUrl || null,
            status: "ready",
            ingredients: {
                create: ingredientsData
            }
        },
    });

    // Future: Trigger Recipe Parser Agent if sourceUrl is present

    revalidatePath("/recipes");
    redirect(`/recipes/${recipe.id}`);
}

export async function finalizeRecipe(recipeId: string) {
    const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: { ingredients: true },
    });

    if (!recipe) {
        throw new Error("Recipe not found");
    }

    if (!recipe.name.trim()) {
        throw new Error("Missing recipe name");
    }

    if (recipe.ingredients.length === 0) {
        throw new Error("Missing ingredients");
    }

    if (!recipe.instructions || !recipe.instructions.trim()) {
        throw new Error("Missing instructions");
    }

    await prisma.recipe.update({
        where: { id: recipeId },
        data: { status: "ready" },
    });

    revalidatePath("/recipes");
    redirect(`/recipes/${recipeId}`);
}

export async function deleteRecipe(id: string) {
    await prisma.recipe.delete({ where: { id } });
    revalidatePath("/recipes");
    redirect("/recipes");
}

export async function retryRecipeParsing(recipeId: string) {
    const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { sourceUrl: true },
    });

    if (!recipe?.sourceUrl) {
        throw new Error("Recipe source URL is missing");
    }

    await prisma.recipe.update({
        where: { id: recipeId },
        data: {
            parsingStatus: "pending",
            parsingError: null,
            parsingUpdatedAt: new Date(),
        },
    });

    await recipeQueue.add("parse", { recipeId, sourceUrl: recipe.sourceUrl });
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);
}

export async function addRecipeIngredientsToGroceriesAction(recipeId: string) {
    const result = await addRecipeIngredientsToGroceries(recipeId);
    revalidatePath("/groceries");
    return result;
}

export async function updateRecipe(formData: FormData) {
    const recipeId = formData.get("recipeId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const instructions = formData.get("instructions") as string;
    const ingredientsJson = formData.get("ingredientsJson") as string;

    if (!recipeId) {
        throw new Error("Missing recipe id");
    }

    const ingredientsInput = ingredientsJson ? JSON.parse(ingredientsJson) as Array<{
        name: string;
        quantity?: string;
        unit?: string;
    }> : [];

    const ingredientsData = ingredientsInput
        .map((item) => ({
            name: item.name?.trim() ?? "",
            quantity: item.quantity?.trim() ?? "",
            unit: item.unit?.trim() ?? "",
        }))
        .filter((item) => item.name.length > 0);

    await prisma.$transaction([
        prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
        prisma.recipe.update({
            where: { id: recipeId },
            data: {
                name,
                description: description || null,
                instructions,
                ingredients: {
                    create: ingredientsData,
                },
            },
        }),
    ]);

    revalidatePath(`/recipes/${recipeId}`);
    redirect(`/recipes/${recipeId}`);
}

export async function updateRecipeDraft(formData: FormData) {
    const recipeId = formData.get("recipeId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const instructions = formData.get("instructions") as string;
    const sourceUrl = formData.get("sourceUrl") as string;
    const ingredientsRaw = formData.get("ingredients") as string;

    if (!recipeId) {
        throw new Error("Missing recipe id");
    }

    const ingredientsData = ingredientsRaw.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => parseIngredientLine(line));

    await prisma.$transaction([
        prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
        prisma.recipe.update({
            where: { id: recipeId },
            data: {
                name,
                description: description || null,
                instructions,
                sourceUrl: sourceUrl || null,
                ingredients: {
                    create: ingredientsData
                },
            },
        }),
    ]);

    revalidatePath(`/recipes/${recipeId}`);
}
