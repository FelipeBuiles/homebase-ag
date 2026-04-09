"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { resolveProposal, writeAuditLog } from "@/lib/db/queries/proposals";
import { updateInventoryItem } from "@/lib/db/queries/inventory";
import { updatePantryItem } from "@/lib/db/queries/pantry";
import { updateGroceryItem } from "@/lib/db/queries/groceries";
import type { JsonPatch } from "@/lib/agents/types";

const action = createSafeActionClient();

export const acceptProposal = action
  .schema(z.object({ proposalId: z.string() }))
  .action(async ({ parsedInput }) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: parsedInput.proposalId },
      include: { changes: true },
    });
    if (!proposal) return { error: "Proposal not found" };

    // Apply patch to the entity
    if (proposal.entityType === "inventory" && proposal.entityId) {
      const patch = proposal.patch as JsonPatch[];
      const updates: Record<string, unknown> = {};
      for (const op of patch) {
        const field = op.path.replace("/", "");
        if (op.op === "replace" || op.op === "add") {
          updates[field] = op.value;
        }
      }
      await updateInventoryItem(proposal.entityId, updates as Parameters<typeof updateInventoryItem>[1]);
    }

    if (proposal.entityType === "pantry" && proposal.entityId) {
      const patch = proposal.patch as JsonPatch[];
      const updates: Record<string, unknown> = {};
      for (const op of patch) {
        const field = op.path.replace("/", "");
        if (op.op === "replace" || op.op === "add") {
          updates[field] = op.value;
        }
      }
      await updatePantryItem(proposal.entityId, updates as Parameters<typeof updatePantryItem>[1]);
    }

    if (proposal.entityType === "grocery-item" && proposal.entityId) {
      const patch = proposal.patch as JsonPatch[];
      const updates: Record<string, unknown> = {};
      for (const op of patch) {
        const field = op.path.replace("/", "");
        if (op.op === "replace" || op.op === "add") {
          updates[field] = op.value;
        }
      }
      await updateGroceryItem(proposal.entityId, updates as Parameters<typeof updateGroceryItem>[1]);
    }

    await resolveProposal(parsedInput.proposalId, "accepted");
    await writeAuditLog({
      actor: "user",
      action: "proposal.accepted",
      entityType: proposal.entityType,
      entityId: proposal.entityId ?? undefined,
      meta: { proposalId: proposal.id, agentId: proposal.agentId },
    });

    revalidatePath("/review");
    revalidatePath("/activity");
    if (proposal.entityId) revalidatePath(`/inventory/${proposal.entityId}`);
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

    revalidatePath("/review");
    revalidatePath("/activity");
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

    // Apply just this one field
    if (proposal.entityType === "inventory" && proposal.entityId) {
      const patch = proposal.patch as JsonPatch[];
      const op = patch.find((p) => p.path === `/${parsedInput.field}`);
      if (op && (op.op === "replace" || op.op === "add")) {
        await updateInventoryItem(
          proposal.entityId,
          { [parsedInput.field]: op.value } as Parameters<typeof updateInventoryItem>[1]
        );
      }
    }

    if (proposal.entityType === "pantry" && proposal.entityId) {
      const patch = proposal.patch as JsonPatch[];
      const op = patch.find((p) => p.path === `/${parsedInput.field}`);
      if (op && (op.op === "replace" || op.op === "add")) {
        await updatePantryItem(
          proposal.entityId,
          { [parsedInput.field]: op.value } as Parameters<typeof updatePantryItem>[1]
        );
      }
    }

    if (proposal.entityType === "grocery-item" && proposal.entityId) {
      const patch = proposal.patch as JsonPatch[];
      const op = patch.find((p) => p.path === `/${parsedInput.field}`);
      if (op && (op.op === "replace" || op.op === "add")) {
        await updateGroceryItem(
          proposal.entityId,
          { [parsedInput.field]: op.value } as Parameters<typeof updateGroceryItem>[1]
        );
      }
    }

    await writeAuditLog({
      actor: "user",
      action: "proposal.change.accepted",
      entityType: proposal.entityType,
      entityId: proposal.entityId ?? undefined,
      meta: { proposalId: proposal.id, field: parsedInput.field },
    });

    revalidatePath("/review");
    if (proposal.entityId) revalidatePath(`/inventory/${proposal.entityId}`);
    return { success: true };
  });
