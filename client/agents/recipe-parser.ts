import { Job } from "bullmq";
import { setupWorker } from "../lib/queue";
import { runAgentPrompt } from "../lib/ai";

console.log("Starting Recipe Parser Agent...");

const processJob = async (job: Job) => {
    const { recipeId, sourceUrl, content } = job.data;
    console.log(`Processing recipe: ${recipeId} (${sourceUrl || 'No URL'})`);

    if (!content) {
        console.log("No recipe content provided. Skipping parsing.");
        return;
    }

    const { data } = await runAgentPrompt(
        "agent_recipe_parser",
        `Recipe content:\n${content}`
    );

    if (!data) {
        console.log("Failed to parse recipe content.");
        return;
    }

    console.log("Parsed recipe data:", data);
};

const worker = setupWorker("recipe-parser", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
