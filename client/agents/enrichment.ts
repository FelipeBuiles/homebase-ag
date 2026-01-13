import { setupWorker } from "../lib/queue";
import prisma from "../lib/prisma";
import { Job } from "bullmq";
import { runAgentPrompt } from "../lib/ai";
import { DEFAULT_INVENTORY_CATEGORIES } from "../lib/inventory";

console.log("Starting Enrichment Agent...");

setupWorker("inventory", async (job: Job) => {
    console.log("Processing job:", job.id, job.name, job.data);

    if (job.name === "created") {
        const { itemId, name, description } = job.data;
        const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        if (!item) return;

        const { data, raw } = await runAgentPrompt(
            "agent_enrichment",
            `Inventory item: ${name}\nDescription: ${description ?? ""}\nExisting categories: ${item.categories.join(", ")}\nAllowed categories: ${DEFAULT_INVENTORY_CATEGORIES.join(", ")}`
        );

        const categories = (data?.categories ?? []).filter((category: string) =>
            DEFAULT_INVENTORY_CATEGORIES.includes(category)
        );

        if (categories.length === 0) {
            console.log("No enrichment categories returned.");
            return;
        }

        const confidence = data?.confidence ?? 0.6;
        const rationale = data?.rationale ?? "AI category suggestion.";

        console.log(`Suggesting categories ${categories.join(", ")} for ${name}`);

        await prisma.proposal.create({
            data: {
                agentId: "agent_enrichment",
                summary: `Categorize '${name}' as ${categories.join(", ")}`,
                changes: {
                    create: {
                        entityType: "InventoryItem",
                        entityId: itemId,
                        confidence,
                        rationale,
                        diff: [{ op: "replace", path: "/categories", value: categories }],
                        before: { name, categories: item.categories },
                        after: { name, categories },
                        metadata: { rawResponse: raw },
                    }
                }
            }
        });
    }
});
