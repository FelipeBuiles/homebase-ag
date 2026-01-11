import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";

console.log("Starting Chef Agent...");

const processJob = async (_job: Job) => {
    void _job;
    console.log("Chef Agent: Looking for meal opportunities...");

    // 1. Find expiring pantry items
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const expiringItems = await prisma.pantryItem.findMany({
        where: {
            expirationDate: {
                lte: nextWeek,
                gte: new Date()
            }
        }
    });

    if (expiringItems.length === 0) {
        console.log("No expiring items to cook with.");
        return;
    }

    console.log(`Found ${expiringItems.length} expiring items.`);

    // 2. Find active meal plan(s) for the next week
    // Simplifying assumption: look for ANY meal plan that covers dates in the future
    const plans = await prisma.mealPlan.findMany({
        where: {
            startDate: {
                gte: new Date(new Date().setDate(new Date().getDate() - 1)) // Recent plans
            }
        },
        include: { items: true }
    });

    // 3. For each expiring item, try to find a recipe and an empty slot
    // This is a naive heuristic for the MVP.
    for (const item of expiringItems) {
        // Find a recipe that uses this ingredient (text search on ingredients - naive)
        // Note: We don't have ingredient text search easily in prisma without full text search feature enabled or raw query
        // We will skip the recipe lookup for now and just suggest a "Generic" meal for the slot to prove the agent works.

        // Find an empty slot in the first available plan
        for (const plan of plans) {
            // Check for empty slots (e.g. Dinner tonite/tomorrow)
            // Simple logic: Find a date in the plan that has no "Dinner"

            for (let i = 0; i < 7; i++) {
                const d = new Date(plan.startDate);
                d.setDate(plan.startDate.getDate() + i);

                // If date is in the past, skip
                if (d < new Date()) continue;

                const hasDinner = plan.items.some(slot =>
                    new Date(slot.date).getDate() === d.getDate() &&
                    slot.mealType === "Dinner"
                );

                if (!hasDinner) {
                    // Evaluate confidence: High if item is expiring very soon
                    const confidence = 0.85;

                    await prisma.proposal.create({
                        data: {
                            agentId: "agent_chef",
                            summary: `Chef's Suggestion: Use up '${item.name}' for Dinner on ${d.toLocaleDateString()}`,
                            changes: {
                                create: {
                                    entityType: "MealPlanItem",
                                    entityId: "new",
                                    confidence: confidence,
                                    rationale: `'${item.name}' expires on ${item.expirationDate?.toLocaleDateString()}. Cook it on ${d.toLocaleDateString()}!`,
                                    diff: [
                                        { op: "add", path: "/planId", value: plan.id },
                                        { op: "add", path: "/date", value: d.toISOString() },
                                        { op: "add", path: "/mealType", value: "Dinner" },
                                        // We aren't linking a specific recipe ID here to keep it simple, 
                                        // unless we found one. We'll just set a note?
                                        // Schema requires recipeId is optional.
                                        // But our UI expects a recipe? UI code: item.recipe?.name || "Custom Meal"
                                        // We can update the UI to show notes if recipe is missing?
                                        // Actually PlanItem schema has `notes`. Let's use that.
                                    ],
                                    // For 'after' snapshot, we show what we'd create
                                    after: {
                                        planId: plan.id,
                                        date: d.toISOString(),
                                        mealType: "Dinner",
                                        notes: `Use ${item.name}`
                                    }
                                }
                            }
                        }
                    });
                    console.log(`Proposed dinner for ${d.toDateString()} using ${item.name}`);
                    break; // One proposal per item is enough for now
                }
            }
        }
    }
};

const worker = setupWorker("chef", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
