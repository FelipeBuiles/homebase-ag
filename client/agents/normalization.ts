import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";

console.log("Starting Normalization Agent...");

const processJob = async (job: Job) => {
    const { itemId, name } = job.data;
    console.log(`Processing grocery item: ${itemId} (${name})`);

    // Simple normalization logic for MVP
    // In a real app, this would use an LLM or a fuzzy match database
    let normalizedName = name.trim();

    // Capitalize first letter
    normalizedName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);

    // Plural to singular (very naive)
    if (normalizedName.endsWith("s") && !normalizedName.endsWith("ss")) {
        normalizedName = normalizedName.slice(0, -1);
    }

    // If no change, standard is good
    if (normalizedName === name) {
        console.log(`No normalization needed for '${name}'`);
        return;
    }

    // Check if we already have a proposal for this item
    // (Skipping for MVP simplicity)

    console.log(`Suggesting normalization: '${name}' -> '${normalizedName}'`);

    // Create Proposal
    await prisma.proposal.create({
        data: {
            agentId: "agent_normalization",
            summary: `Normalize '${name}' to '${normalizedName}'`,
            changes: {
                create: {
                    entityType: "GroceryItem",
                    entityId: itemId,
                    confidence: 0.85,
                    rationale: `Standardizing name to singular/capitalized form.`,
                    diff: [{ op: "replace", path: "/name", value: normalizedName }],
                    before: { name },
                    after: { name: normalizedName },
                }
            }
        }
    });
};

const worker = setupWorker("grocery", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
