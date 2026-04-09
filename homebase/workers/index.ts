import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

// Import agents
import { runEnrichmentAgent } from "../src/lib/agents/enrichment";
import { runRecipeParserAgent } from "../src/lib/agents/recipe-parser";
import { runExpirationAgent } from "../src/lib/agents/expiration";
import { runNormalizationAgent } from "../src/lib/agents/normalization";
import { runChefAgent } from "../src/lib/agents/chef";
import { runPantryMaintenanceAgent } from "../src/lib/agents/pantry-maintenance";
import { createProposal, writeAuditLog } from "../src/lib/db/queries/proposals";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "agents",
  async (job) => {
    console.log(`[worker] Running job: ${job.name} for entity ${job.data.entityId}`);

    switch (job.name) {
      case "enrichment": {
        const proposal = await runEnrichmentAgent(job.data.entityId);

        if (proposal.changes.length === 0) {
          console.log(`[worker] Enrichment: no changes suggested for ${job.data.entityId}`);
          return;
        }

        await createProposal(proposal);
        await writeAuditLog({
          actor: "enrichment",
          action: "proposal.created",
          entityType: "inventory",
          entityId: job.data.entityId,
          meta: { confidence: proposal.confidence, changeCount: proposal.changes.length },
        });

        console.log(`[worker] Enrichment proposal created with ${proposal.changes.length} changes`);
        break;
      }

      case "recipe-parser": {
        const url = job.data.context?.url as string;
        if (!url) throw new Error("recipe-parser job missing context.url");
        await runRecipeParserAgent(job.data.entityId, url);
        await writeAuditLog({
          actor: "recipe-parser",
          action: "recipe.parsed",
          entityType: "recipe",
          entityId: job.data.entityId,
        });
        console.log(`[worker] Recipe parsed: ${job.data.entityId}`);
        break;
      }

      case "expiration": {
        const proposals = await runExpirationAgent();
        for (const proposal of proposals) {
          await createProposal(proposal);
          await writeAuditLog({
            actor: "expiration",
            action: "proposal.created",
            entityType: "pantry",
            entityId: proposal.entityId,
            meta: { rationale: proposal.rationale },
          });
        }
        console.log(`[worker] Expiration scan complete: ${proposals.length} proposals created`);
        break;
      }

      case "normalization": {
        const proposals = await runNormalizationAgent(job.data.entityId);
        for (const proposal of proposals) {
          await createProposal(proposal);
          await writeAuditLog({
            actor: "normalization",
            action: "proposal.created",
            entityType: "grocery-item",
            entityId: proposal.entityId,
          });
        }
        console.log(`[worker] Normalization complete: ${proposals.length} proposals created`);
        break;
      }

      case "chef": {
        const proposals = await runChefAgent(job.data.entityId);
        for (const proposal of proposals) {
          await createProposal(proposal);
          await writeAuditLog({
            actor: "chef",
            action: "proposal.created",
            entityType: "meal-plan",
            entityId: proposal.entityId,
          });
        }
        console.log(`[worker] Chef agent complete: ${proposals.length} proposals created`);
        break;
      }

      case "pantry-maintenance": {
        const proposals = await runPantryMaintenanceAgent();
        for (const proposal of proposals) {
          await createProposal(proposal);
          await writeAuditLog({
            actor: "pantry-maintenance",
            action: "proposal.created",
            entityType: "pantry",
            entityId: proposal.entityId,
          });
        }
        console.log(`[worker] Pantry maintenance complete: ${proposals.length} proposals created`);
        break;
      }

      default:
        console.warn(`[worker] Unknown job: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  if (job) {
    writeAuditLog({
      actor: job.name,
      action: "job.failed",
      entityId: job.data.entityId,
      meta: { error: err.message },
    }).catch(() => {});
  }
});

console.log("[worker] HomeBase agent worker started");
