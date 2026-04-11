import { runChefAgent } from "@/lib/agents/chef";
import { runEnrichmentAgent } from "@/lib/agents/enrichment";
import { runExpirationAgent } from "@/lib/agents/expiration";
import { runNormalizationAgent } from "@/lib/agents/normalization";
import { runPantryMaintenanceAgent } from "@/lib/agents/pantry-maintenance";
import { runRecipeParserAgent } from "@/lib/agents/recipe-parser";
import { createProposal, writeAuditLog } from "@/lib/db/queries/proposals";

async function createProposalBatch(
  actor: string,
  entityType: string,
  proposals: Awaited<ReturnType<typeof runExpirationAgent>>
) {
  for (const proposal of proposals) {
    await createProposal(proposal);
    await writeAuditLog({
      actor,
      action: "proposal.created",
      entityType,
      entityId: proposal.entityId,
      meta:
        actor === "expiration"
          ? { rationale: proposal.rationale }
          : actor === "enrichment"
            ? { confidence: proposal.confidence, changeCount: proposal.changes.length }
            : undefined,
    });
  }
}

async function logFailure(actor: string, entityId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await writeAuditLog({
    actor,
    action: "job.failed",
    entityId,
    meta: { error: message },
  }).catch(() => {});
}

export async function executeEnrichmentAgent(itemId: string) {
  try {
    const proposal = await runEnrichmentAgent(itemId);
    if (proposal.changes.length === 0) {
      return { createdProposal: false };
    }

    await createProposal(proposal);
    await writeAuditLog({
      actor: "enrichment",
      action: "proposal.created",
      entityType: "inventory",
      entityId: itemId,
      meta: { confidence: proposal.confidence, changeCount: proposal.changes.length },
    });

    return { createdProposal: true };
  } catch (error) {
    await logFailure("enrichment", itemId, error);
    throw error;
  }
}

export async function executeRecipeParserAgent(recipeId: string, url: string) {
  try {
    await runRecipeParserAgent(recipeId, url);
    await writeAuditLog({
      actor: "recipe-parser",
      action: "recipe.parsed",
      entityType: "recipe",
      entityId: recipeId,
    });
  } catch (error) {
    await logFailure("recipe-parser", recipeId, error);
    throw error;
  }
}

export async function executeExpirationScanAgent() {
  try {
    const proposals = await runExpirationAgent();
    await createProposalBatch("expiration", "pantry", proposals);
    return { proposalCount: proposals.length };
  } catch (error) {
    await logFailure("expiration", "all", error);
    throw error;
  }
}

export async function executeNormalizationAgent(listId: string) {
  try {
    const proposals = await runNormalizationAgent(listId);
    await createProposalBatch("normalization", "grocery-item", proposals);
    return { proposalCount: proposals.length };
  } catch (error) {
    await logFailure("normalization", listId, error);
    throw error;
  }
}

export async function executeChefAgent(planId: string) {
  try {
    const proposals = await runChefAgent(planId);
    await createProposalBatch("chef", "meal-plan", proposals);
    return { proposalCount: proposals.length };
  } catch (error) {
    await logFailure("chef", planId, error);
    throw error;
  }
}

export async function executePantryMaintenanceAgent() {
  try {
    const proposals = await runPantryMaintenanceAgent();
    await createProposalBatch("pantry-maintenance", "pantry", proposals);
    return { proposalCount: proposals.length };
  } catch (error) {
    await logFailure("pantry-maintenance", "all", error);
    throw error;
  }
}
