import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { setupWorker } from "../lib/queue";
import { runAgentPrompt } from "../lib/ai";
import { buildPantryMaintenanceInput } from "../lib/pantry/maintenance";

console.log("Starting Pantry Maintenance Agent...");

export const processPantryMaintenanceJob = async (_job: Job) => {
  void _job;
  console.log("Running pantry maintenance...");

  const items = await prisma.pantryItem.findMany({
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (items.length === 0) return;

  const input = buildPantryMaintenanceInput(items);
  const { data, raw } = await runAgentPrompt("agent_pantry_maintenance", input);
  const actions = data?.actions ?? [];

  if (!actions.length) return;

  const itemsById = new Map(items.map((item) => [item.id, item]));

  for (const action of actions) {
    const item = itemsById.get(action.pantryItemId);
    if (!item) continue;

    await prisma.proposal.create({
      data: {
        agentId: "agent_pantry_maintenance",
        summary: `Pantry maintenance: ${item.name} -> ${action.status}`,
        changes: {
          create: {
            entityType: "PantryItem",
            entityId: action.pantryItemId,
            confidence: action.confidence ?? 0.7,
            rationale: action.rationale ?? "Maintenance suggestion.",
            diff: [{ op: "replace", path: "/status", value: action.status }],
            before: { status: item.status },
            after: { status: action.status },
            metadata: { rawResponse: raw },
          },
        },
      },
    });
  }
};

const worker = setupWorker("pantry-maintenance", processPantryMaintenanceJob);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
