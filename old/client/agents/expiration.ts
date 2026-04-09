import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";
import { runAgentPrompt } from "../lib/ai";
import { getAppConfig } from "../lib/settings";
import { buildExpiringPantryWhere } from "../lib/pantry/expiration-agent";

console.log("Starting Expiration Agent...");

const processJob = async (_job: Job) => {
    void _job;
    console.log("Running expiration check...");

    const appConfig = await getAppConfig();
    const warningDays = appConfig?.pantryWarningDays ?? 7;
    const now = new Date();

    const expiringItems = await prisma.pantryItem.findMany({
        where: buildExpiringPantryWhere(now, warningDays)
    });

    console.log(`Found ${expiringItems.length} expiring items.`);

    for (const item of expiringItems) {
        const { data, raw } = await runAgentPrompt(
            "agent_expiration",
            `Pantry item: ${item.name}\nExpires: ${item.expirationDate?.toISOString() ?? "unknown"}\nOpened: ${item.openedDate?.toISOString() ?? "unknown"}\nQuantity: ${item.quantity ?? "unknown"}`
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
