import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";

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
        // Check if we already have a proposal for this
        // (Skipping duplicate check for MVP simplicity)

        await prisma.proposal.create({
            data: {
                agentId: "agent_expiration",
                summary: `Pantry item '${item.name}' is expiring soon. Add to groceries?`,
                changes: {
                    create: {
                        entityType: "GroceryItem",
                        entityId: "new", // Placeholder, creating new
                        confidence: 0.9,
                        rationale: `Item expires on ${item.expirationDate?.toLocaleDateString()}`,
                        diff: [
                            { op: "add", path: "/name", value: item.name },
                            { op: "add", path: "/quantity", value: "1" } // Default quantity
                        ],
                        before: {},
                        after: { name: item.name, quantity: "1" }
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
