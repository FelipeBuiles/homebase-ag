import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";
import { runAgentPrompt } from "../lib/ai";

console.log("Starting Normalization Agent...");

const processJob = async (job: Job) => {
    const { itemId, name } = job.data;
    console.log(`Processing grocery item: ${itemId} (${name})`);

    const { data, raw } = await runAgentPrompt(
        "agent_normalization",
        `Grocery item name: ${name}`
    );

    const normalizedName = data?.normalizedName?.trim() ?? "";
    const confidence = data?.confidence ?? 0.5;
    const rationale = data?.rationale ?? "AI normalization suggestion.";

    if (!normalizedName || normalizedName === name) {
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
                    confidence,
                    rationale,
                    diff: [{ op: "replace", path: "/name", value: normalizedName }],
                    before: { name },
                    after: { name: normalizedName },
                    metadata: { rawResponse: raw },
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
