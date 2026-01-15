import { Job } from "bullmq";
import { setupWorker } from "../lib/queue";
import { runAgentPrompt } from "../lib/ai";
import prisma from "../lib/prisma";
import { applyParsedRecipe } from "../lib/recipes";
import { extractRecipeImageUrl } from "../lib/recipe-image";

console.log("Starting Recipe Parser Agent...");

const stripHtml = (value: string) =>
    value.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const processJob = async (job: Job) => {
    const { recipeId, sourceUrl, content } = job.data;
    console.log(`Processing recipe: ${recipeId} (${sourceUrl || 'No URL'})`);

    try {
        let recipeContent = content as string | undefined;
        let html: string | undefined;
        if (!recipeContent && sourceUrl) {
            const response = await fetch(sourceUrl);
            html = await response.text();
            recipeContent = stripHtml(html);
        }

        if (!recipeContent) {
            console.log("No recipe content provided. Skipping parsing.");
            return;
        }

        await prisma.recipe.update({
            where: { id: recipeId },
            data: { parsingStatus: "parsing", parsingUpdatedAt: new Date() },
        });

        const { data } = await runAgentPrompt(
            "agent_recipe_parser",
            `Recipe content:\n${recipeContent}`
        );

        if (!data) {
            console.log("Failed to parse recipe content.");
            await prisma.recipe.update({
                where: { id: recipeId },
                data: {
                    parsingStatus: "error",
                    parsingError: "Parser returned no data",
                    parsingUpdatedAt: new Date(),
                },
            });
            return;
        }

        const imageUrl = html ? extractRecipeImageUrl(html, sourceUrl) : null;

        await applyParsedRecipe(recipeId, { ...data, imageUrl });
        console.log("Parsed recipe data:", data);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await prisma.recipe.update({
            where: { id: recipeId },
            data: {
                parsingStatus: "error",
                parsingError: message,
                parsingUpdatedAt: new Date(),
            },
        });
        throw error;
    }
};

const worker = setupWorker("recipe-parser", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
