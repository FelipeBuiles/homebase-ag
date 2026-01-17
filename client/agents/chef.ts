import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";
import { runAgentPrompt } from "../lib/ai";
import { filterInStockPantryItems } from "../lib/pantry/filters";

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
            },
        }
    });
    const inStockItems = filterInStockPantryItems(expiringItems);

    if (inStockItems.length === 0) {
        console.log("No expiring items to cook with.");
        return;
    }

    console.log(`Found ${inStockItems.length} expiring items.`);

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

    if (plans.length === 0) {
        console.log("No meal plans available.");
        return;
    }

    const openSlots = plans.flatMap((plan) => {
        const slots: { planId: string; date: string; mealType: "Breakfast" | "Lunch" | "Dinner" }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(plan.startDate);
            d.setDate(plan.startDate.getDate() + i);
            if (d < new Date()) continue;

            (["Breakfast", "Lunch", "Dinner"] as const).forEach((mealType) => {
                const exists = plan.items.some(
                    (slot) =>
                        new Date(slot.date).toDateString() === d.toDateString() &&
                        slot.mealType === mealType
                );
                if (!exists) {
                    slots.push({ planId: plan.id, date: d.toISOString(), mealType });
                }
            });
        }
        return slots;
    });

    if (openSlots.length === 0) {
        console.log("No open meal plan slots.");
        return;
    }

    const { data, raw } = await runAgentPrompt(
        "agent_chef",
        `Expiring pantry items: ${inStockItems.map((item) => item.name).join(", ")}\nOpen slots: ${JSON.stringify(openSlots)}`
    );

    const suggestions = data?.suggestions ?? [];
    for (const suggestion of suggestions) {
        if (
            typeof suggestion?.planId !== "string" ||
            typeof suggestion?.date !== "string" ||
            typeof suggestion?.mealType !== "string"
        ) {
            continue;
        }

        const matchingSlot = openSlots.find(
            (slot) =>
                slot.planId === suggestion.planId &&
                slot.date === suggestion.date &&
                slot.mealType === suggestion.mealType
        );
        if (!matchingSlot) continue;

        const confidence = suggestion?.confidence ?? 0.7;
        const rationale = suggestion?.rationale ?? "AI meal suggestion.";
        const notes = suggestion?.notes ?? "";

        await prisma.proposal.create({
            data: {
                agentId: "agent_chef",
                summary: `Chef's Suggestion: ${notes || "Meal suggestion"} on ${new Date(suggestion.date).toLocaleDateString()}`,
                changes: {
                    create: {
                        entityType: "MealPlanItem",
                        entityId: "new",
                        confidence,
                        rationale,
                        diff: [
                            { op: "add", path: "/planId", value: suggestion.planId },
                            { op: "add", path: "/date", value: suggestion.date },
                            { op: "add", path: "/mealType", value: suggestion.mealType },
                        ],
                        after: {
                            planId: suggestion.planId,
                            date: suggestion.date,
                            mealType: suggestion.mealType,
                            notes,
                        },
                        metadata: { rawResponse: raw },
                    },
                },
            },
        });
    }
};

const worker = setupWorker("chef", processJob);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
