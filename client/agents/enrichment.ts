import { setupWorker } from "../lib/queue";
import prisma from "../lib/prisma";
import { Job } from "bullmq";

console.log("Starting Enrichment Agent...");

setupWorker("inventory", async (job: Job) => {
    console.log("Processing job:", job.id, job.name, job.data);

    if (job.name === "created") {
        const { itemId, name } = job.data;

        // Simple rule-based "AI"
        let suggestedCategory = null;
        if (name.toLowerCase().includes("apple")) suggestedCategory = "Fruit";
        else if (name.toLowerCase().includes("milk")) suggestedCategory = "Dairy";

        if (suggestedCategory) {
            console.log(`Suggesting category ${suggestedCategory} for ${name}`);

            await prisma.proposal.create({
                data: {
                    agentId: "agent_enrichment",
                    summary: `Categorize '${name}' as ${suggestedCategory}`,
                    changes: {
                        create: {
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: 0.95,
                            rationale: `Detected '${name}' which is a known ${suggestedCategory}`,
                            diff: [{ op: "replace", path: "/category", value: suggestedCategory }],
                            before: { name, category: null },
                            after: { name, category: suggestedCategory },
                        }
                    }
                }
            });
        }
    }
});
