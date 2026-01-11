import { Job } from "bullmq";
import { setupWorker } from "../lib/queue";

console.log("Starting Recipe Parser Agent...");

const processJob = async (job: Job) => {
    const { recipeId, sourceUrl } = job.data;
    console.log(`Processing recipe: ${recipeId} (${sourceUrl || 'No URL'})`);

    if (!sourceUrl) {
        console.log("No source URL provided. Skipping parsing.");
        return;
    }

    // MVP: Just log that we would parse it
    // Future: Fetch URL, use Cheerio/Puppeteer or LLM to extract JSON-LD recipe data
    console.log(`[STUB] Fetching content from ${sourceUrl}...`);
    console.log(`[STUB] Extracting ingredients and instructions...`);

    // Example of what we might do:
    // await prisma.proposal.create({ ... })
};

const worker = setupWorker("recipe-parser", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
