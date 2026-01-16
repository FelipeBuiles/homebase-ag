import { Job } from "bullmq";
import { setupWorker } from "../lib/queue";
import { normalizeGroceryItem } from "../lib/groceries-normalization";

console.log("Starting Normalization Agent...");

const processJob = async (job: Job) => {
    const { itemId, name } = job.data;
    console.log(`Processing grocery item: ${itemId} (${name})`);

    await normalizeGroceryItem(itemId, name);
};

const worker = setupWorker("grocery", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
