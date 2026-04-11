"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import {
  resolveProposal,
  resolveAllPending,
  listPendingByAgent,
  writeAuditLog,
} from "@/lib/db/queries/proposals";
import { updateInventoryItem } from "@/lib/db/queries/inventory";
import { updatePantryItem } from "@/lib/db/queries/pantry";
import { updateGroceryItem } from "@/lib/db/queries/groceries";
import { addMealPlanItem } from "@/lib/db/queries/meal-plans";
import { action } from "@/lib/auth/action";
import type { JsonPatch } from "@/lib/agents/types";

/** Map entityType to the route prefix for revalidation. */
function entityPath(entityType: string, entityId: string): string {
  const prefix: Record<string, string> = {
    inventory: "/inventory",
    pantry: "/pantry",
    "grocery-item": "/groceries",
    recipe: "/recipes",
    "meal-plan": "/meal-plans",
  };
  return `${prefix[entityType] ?? "/"}/${entityId}`;
}

/** Apply a JSON Patch to the entity targeted by a proposal. */
async function applyPatch(entityType: string, entityId: string, patch: JsonPatch[]) {
  const updates: Record<string, unknown> = {};
  for (const op of patch) {
    const field = op.path.replace(/^\//, "");
    if (op.op === "replace" || op.op === "add") {
      updates[field] = op.value;
    }
  }

  if (entityType === "inventory") {
    await updateInventoryItem(entityId, updates as Parameters<typeof updateInventoryItem>[1]);
  } else if (entityType === "pantry") {
    await updatePantryItem(entityId, updates as Parameters<typeof updatePantryItem>[1]);
  } else if (entityType === "grocery-item") {
    await updateGroceryItem(entityId, updates as Parameters<typeof updateGroceryItem>[1]);
  } else if (entityType === "meal-plan") {
    const suggestions = updates.suggestions as Array<{
      dayOffset: number;
      mealType: string;
      recipeId: string;
    }> | undefined;
    if (!suggestions || suggestions.length === 0) return;

    const plan = await prisma.mealPlan.findUnique({
      where: { id: entityId },
      include: { items: true },
    });
    if (!plan) throw new Error("Meal plan not found");

    const existingKeys = new Set(
      plan.items.map((item) => `${item.date.toISOString().slice(0, 10)}:${item.mealType}`)
    );

    for (const suggestion of suggestions) {
      const date = new Date(plan.weekStart);
      date.setUTCDate(date.getUTCDate() + suggestion.dayOffset);
      const key = `${date.toISOString().slice(0, 10)}:${suggestion.mealType}`;
      if (existingKeys.has(key)) continue;

      await addMealPlanItem({
        planId: entityId,
        recipeId: suggestion.recipeId,
        date,
        mealType: suggestion.mealType,
      });
      existingKeys.add(key);
    }
  }
}

/** Revalidate common paths after proposal resolution. */
function revalidateAfterResolve(entityType?: string, entityId?: string | null) {
  revalidatePath("/review");
  revalidatePath("/activity");
  if (entityType && entityId) {
    revalidatePath(entityPath(entityType, entityId));
  }
}

export const acceptProposal = action
  .schema(z.object({ proposalId: z.string() }))
  .action(async ({ parsedInput }) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: parsedInput.proposalId },
      include: { changes: true },
    });
    if (!proposal) return { error: "Proposal not found" };

    if (proposal.entityId) {
      await applyPatch(proposal.entityType, proposal.entityId, proposal.patch as JsonPatch[]);
    }

    await resolveProposal(parsedInput.proposalId, "accepted");
    await writeAuditLog({
      actor: "user",
      action: "proposal.accepted",
      entityType: proposal.entityType,
      entityId: proposal.entityId ?? undefined,
      meta: { proposalId: proposal.id, agentId: proposal.agentId },
    });

    revalidateAfterResolve(proposal.entityType, proposal.entityId);
    return { success: true };
  });

export const rejectProposal = action
  .schema(z.object({ proposalId: z.string() }))
  .action(async ({ parsedInput }) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: parsedInput.proposalId },
    });
    if (!proposal) return { error: "Proposal not found" };

    await resolveProposal(parsedInput.proposalId, "rejected");
    await writeAuditLog({
      actor: "user",
      action: "proposal.rejected",
      entityType: proposal.entityType,
      entityId: proposal.entityId ?? undefined,
      meta: { proposalId: proposal.id, agentId: proposal.agentId },
    });

    revalidateAfterResolve(proposal.entityType, proposal.entityId);
    return { success: true };
  });

export const acceptChange = action
  .schema(z.object({ proposalId: z.string(), field: z.string() }))
  .action(async ({ parsedInput }) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: parsedInput.proposalId },
      include: { changes: true },
    });
    if (!proposal) return { error: "Proposal not found" };

    const change = proposal.changes.find((c) => c.field === parsedInput.field);
    if (!change) return { error: "Change not found" };

    if (proposal.entityId) {
      const patch = proposal.patch as JsonPatch[];
      const op = patch.find((p) => p.path === `/${parsedInput.field}`);
      if (op && (op.op === "replace" || op.op === "add")) {
        await applyPatch(proposal.entityType, proposal.entityId, [
          { op: op.op, path: op.path, value: op.value },
        ]);
      }
    }

    await writeAuditLog({
      actor: "user",
      action: "proposal.change.accepted",
      entityType: proposal.entityType,
      entityId: proposal.entityId ?? undefined,
      meta: { proposalId: proposal.id, field: parsedInput.field },
    });

    revalidateAfterResolve(proposal.entityType, proposal.entityId);
    return { success: true };
  });

export const acceptAllProposals = action
  .schema(z.void())
  .action(async () => {
    const proposals = await prisma.proposal.findMany({
      where: { status: "pending" },
      include: { changes: true },
    });

    let applied = 0;
    for (const proposal of proposals) {
      try {
        if (proposal.entityId) {
          await applyPatch(proposal.entityType, proposal.entityId, proposal.patch as JsonPatch[]);
        }
        await resolveProposal(proposal.id, "accepted");
        await writeAuditLog({
          actor: "user",
          action: "proposal.accepted",
          entityType: proposal.entityType,
          entityId: proposal.entityId ?? undefined,
          meta: { proposalId: proposal.id, agentId: proposal.agentId },
        });
        applied++;
      } catch {
        // Skip failed proposals — user can handle individually
      }
    }

    revalidatePath("/review");
    revalidatePath("/activity");
    revalidatePath("/pantry");
    revalidatePath("/inventory");
    revalidatePath("/groceries");
    return { success: true, count: applied };
  });

export const rejectAllProposals = action
  .schema(z.void())
  .action(async () => {
    const result = await resolveAllPending("rejected");
    await writeAuditLog({
      actor: "user",
      action: "proposal.rejected_all",
      meta: { count: result.count },
    });

    revalidatePath("/review");
    revalidatePath("/activity");
    return { success: true, count: result.count };
  });

export const acceptProposalsByAgent = action
  .schema(z.object({ agentId: z.string() }))
  .action(async ({ parsedInput }) => {
    const proposals = await listPendingByAgent(parsedInput.agentId);

    let applied = 0;
    for (const proposal of proposals) {
      try {
        if (proposal.entityId) {
          await applyPatch(proposal.entityType, proposal.entityId, proposal.patch as JsonPatch[]);
        }
        await resolveProposal(proposal.id, "accepted");
        await writeAuditLog({
          actor: "user",
          action: "proposal.accepted",
          entityType: proposal.entityType,
          entityId: proposal.entityId ?? undefined,
          meta: { proposalId: proposal.id, agentId: proposal.agentId },
        });
        applied++;
      } catch {
        // Skip failed proposals
      }
    }

    revalidatePath("/review");
    revalidatePath("/activity");
    revalidatePath("/pantry");
    revalidatePath("/inventory");
    revalidatePath("/groceries");
    return { success: true, count: applied };
  });
