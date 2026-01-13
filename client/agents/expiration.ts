import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";
import { runAgentPrompt } from "../lib/ai";

console.log("Starting Expiration Agent...");

const processJob = async (_job: Job) => {
    void _job;
    console.log("Running expiration check...");

    // Find items expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringItems = await prisma.pantryItem.findMany({
        where: {
            expirationDate: {
                lte: sevenDaysFromNow,
                gte: new Date() // Not already expired (optional choice)
            }
        }
    });

    console.log(`Found ${expiringItems.length} expiring items.`);

    for (const item of expiringItems) {
        const { data, raw } = await runAgentPrompt(
            "agent_expiration",
            `Pantry item: ${item.name}\nExpires: ${item.expirationDate?.toISOString() ?? "unknown"}\nQuantity: ${item.quantity ?? "unknown"}`
        );

        const shouldCreate = data?.shouldCreate ?? false;
        if (!shouldCreate) {
            console.log(`No grocery suggestion for ${item.name}`);
            continue;
        }

        const suggestedName = data?.name ?? item.name;
        const quantity = data?.quantity ?? "1";
        const confidence = data?.confidence ?? 0.7;
        const rationale = data?.rationale ?? `Item expires on ${item.expirationDate?.toLocaleDateString()}`;

        await prisma.proposal.create({
            data: {
                agentId: "agent_expiration",
                summary: `Pantry item '${item.name}' is expiring soon. Add to groceries?`,
                changes: {
                    create: {
                        entityType: "GroceryItem",
                        entityId: "new",
                        confidence,
                        rationale,
                        diff: [
                            { op: "add", path: "/name", value: suggestedName },
                            { op: "add", path: "/quantity", value: quantity }
                        ],
                        before: {},
                        after: { name: suggestedName, quantity },
                        metadata: { rawResponse: raw }
                    }
                }
            }
        });
        console.log(`Created proposal for ${item.name}`);
    }
};

const worker = setupWorker("expiration", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
