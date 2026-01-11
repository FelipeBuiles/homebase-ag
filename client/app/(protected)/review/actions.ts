'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { JsonPatchOp } from "@/lib/types";

type UpdateModel = {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
};

const ENTITY_FIELDS: Record<string, { allowed: string[]; requiredOnCreate: string[] }> = {
    InventoryItem: {
        allowed: ["name", "category", "location", "tags", "photoUrl", "description"],
        requiredOnCreate: ["name"],
    },
    GroceryItem: {
        allowed: ["name", "category", "quantity", "isChecked", "listId"],
        requiredOnCreate: ["name", "listId"],
    },
    MealPlanItem: {
        allowed: ["date", "mealType", "notes", "recipeId", "planId"],
        requiredOnCreate: ["date", "mealType", "planId"],
    },
};

const decodePointer = (segment: string) =>
    segment.replace(/~1/g, "/").replace(/~0/g, "~");

const isArrayIndex = (segment: string) =>
    segment === "-" || /^[0-9]+$/.test(segment);

const cloneValue = <T,>(value: T): T => {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
};

const applyJsonPatch = (
    base: Record<string, unknown>,
    diff: JsonPatchOp[]
): Record<string, unknown> => {
    const result = cloneValue(base);

    for (const op of diff) {
        if (!op.path || typeof op.path !== "string" || !op.path.startsWith("/")) continue;
        const segments = op.path
            .split("/")
            .slice(1)
            .map(decodePointer)
            .filter(Boolean);
        if (segments.length === 0) continue;

        let current: unknown = result;
        for (let i = 0; i < segments.length - 1; i += 1) {
            const segment = segments[i];
            const next = segments[i + 1];
            if (Array.isArray(current)) {
                const index = Number(segment);
                if (Number.isNaN(index)) {
                    current = null;
                    break;
                }
                if (current[index] === undefined) {
                    current[index] = isArrayIndex(next) ? [] : {};
                }
                current = current[index];
            } else if (current && typeof current === "object") {
                const obj = current as Record<string, unknown>;
                if (obj[segment] === undefined) {
                    obj[segment] = isArrayIndex(next) ? [] : {};
                }
                current = obj[segment];
            } else {
                current = null;
                break;
            }
        }

        if (!current) continue;
        const key = segments[segments.length - 1];

        if (Array.isArray(current)) {
            if (key === "-") {
                if (op.op === "add") current.push(op.value);
                continue;
            }
            const index = Number(key);
            if (Number.isNaN(index)) continue;
            if (op.op === "add") current.splice(index, 0, op.value);
            if (op.op === "replace") current[index] = op.value;
            if (op.op === "remove") current.splice(index, 1);
            continue;
        }

        if (current && typeof current === "object") {
            const obj = current as Record<string, unknown>;
            if (op.op === "add" || op.op === "replace") obj[key] = op.value;
            if (op.op === "remove") delete obj[key];
        }
    }

    return result;
};

const buildChangeData = (
    change: { after: unknown; before: unknown; diff: unknown }
): Record<string, unknown> => {
    const after = change.after as Record<string, unknown> | null;
    if (after && typeof after === "object" && Object.keys(after).length > 0) {
        return { ...after };
    }

    const before = change.before as Record<string, unknown> | null;
    const base = before && typeof before === "object" ? before : {};
    const diffOps = Array.isArray(change.diff) ? (change.diff as JsonPatchOp[]) : [];
    if (diffOps.length === 0) return {};

    return applyJsonPatch(base, diffOps);
};

const filterChangeData = (
    entityType: string,
    data: Record<string, unknown>
): Record<string, unknown> => {
    const allowed = ENTITY_FIELDS[entityType]?.allowed;
    if (!allowed) return {};

    const unknownKeys = Object.keys(data).filter((key) => !allowed.includes(key));
    if (unknownKeys.length > 0) {
        throw new Error(`VALIDATION: Unsupported fields: ${unknownKeys.join(", ")}`);
    }

    return allowed.reduce<Record<string, unknown>>((acc, key) => {
        if (key in data) acc[key] = data[key];
        return acc;
    }, {});
};

const validateRequired = (
    entityType: string,
    data: Record<string, unknown>
): void => {
    const required = ENTITY_FIELDS[entityType]?.requiredOnCreate ?? [];
    const missing = required.filter((key) => data[key] === undefined || data[key] === null);
    if (missing.length > 0) {
        throw new Error(`VALIDATION: Missing required fields: ${missing.join(", ")}`);
    }
};

export async function approveProposal(proposalId: string) {
    await approveSelectedChanges(proposalId, null);
}

export async function approveSelectedChanges(proposalId: string, changeIds: string[] | null) {
    const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { changes: true }
    });

    if (!proposal) return;
    if (proposal.status !== "pending") return;

    const acceptedIds = changeIds ?? proposal.changes.map((change) => change.id);
    const acceptedSet = new Set(acceptedIds);
    const acceptedChanges = proposal.changes.filter((change) => acceptedSet.has(change.id));
    const rejectedChanges = proposal.changes.filter((change) => !acceptedSet.has(change.id));

    if (acceptedChanges.length === 0) {
        await rejectProposal(proposalId);
        return;
    }

    // Apply changes transactionally
    try {
        await prisma.$transaction(async (tx) => {
            for (const change of acceptedChanges) {
                // Determine model based on entityType
                let model: UpdateModel | null = null;
                if (change.entityType === 'InventoryItem') model = tx.inventoryItem as unknown as UpdateModel;
                if (change.entityType === 'GroceryItem') model = tx.groceryItem as unknown as UpdateModel;
                if (change.entityType === 'MealPlanItem') model = tx.mealPlanItem as unknown as UpdateModel;

                if (!model) {
                    throw new Error(`VALIDATION: Unsupported entity type: ${change.entityType}`);
                }

                const rawData = buildChangeData(change);
                const dataToUpdate = filterChangeData(change.entityType, rawData);

                if (Object.keys(dataToUpdate).length === 0) continue;

                if (change.entityId === 'new') {
                    // Handle Creation
                    if (change.entityType === 'GroceryItem' && !dataToUpdate.listId) {
                        // We need a listId. Find default or first list, or create one.
                        let list = await tx.groceryList.findFirst({ where: { isDefault: true } });
                        if (!list) list = await tx.groceryList.findFirst();
                        if (!list) list = await tx.groceryList.create({ data: { name: 'My List', isDefault: true } });
                        dataToUpdate.listId = list.id;
                    }

                    validateRequired(change.entityType, dataToUpdate);

                    await model.create({
                        data: dataToUpdate
                    });
                } else {
                    // Handle Update
                    await model.update({
                        where: { id: change.entityId },
                        data: dataToUpdate
                    });
                }
            }

            await tx.proposal.update({
                where: { id: proposalId },
                data: { status: 'accepted' }
            });

            await tx.auditLog.create({
                data: {
                    action: "proposal.accepted",
                    details: {
                        proposalId,
                        agentId: proposal.agentId,
                        summary: proposal.summary,
                        changeCount: proposal.changes.length,
                        acceptedChangeIds: acceptedChanges.map((change) => change.id),
                        rejectedChangeIds: rejectedChanges.map((change) => change.id),
                    }
                }
            });
        });
    } catch (e: unknown) {
        const error = e as { code?: string; message?: string };
        const isValidation = error.message?.startsWith("VALIDATION:");
        if (error.code === 'P2025') {
            // Record not found
            await prisma.proposal.update({
                where: { id: proposalId },
                data: { status: 'failed', summary: proposal.summary + " (Failed: Entity not found)" }
            });
            await prisma.auditLog.create({
                data: {
                    action: "proposal.failed",
                    details: {
                        proposalId,
                        agentId: proposal.agentId,
                        summary: proposal.summary,
                        reason: "entity_not_found",
                    }
                }
            });
        } else if (isValidation) {
            await prisma.proposal.update({
                where: { id: proposalId },
                data: { status: 'failed', summary: `${proposal.summary} (Failed: ${error.message})` }
            });
            await prisma.auditLog.create({
                data: {
                    action: "proposal.failed",
                    details: {
                        proposalId,
                        agentId: proposal.agentId,
                        summary: proposal.summary,
                        reason: error.message,
                    }
                }
            });
        } else {
            throw e;
        }
    }

    revalidatePath('/review');
    revalidatePath('/inventory');
    revalidatePath('/groceries');
}

export async function rejectProposal(proposalId: string) {
    const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
    });
    if (!proposal) return;
    if (proposal.status !== "pending") return;

    await prisma.$transaction(async (tx) => {
        await tx.proposal.update({
            where: { id: proposalId },
            data: { status: 'rejected' }
        });
        await tx.auditLog.create({
            data: {
                action: "proposal.rejected",
                details: {
                    proposalId,
                    agentId: proposal.agentId,
                    summary: proposal.summary,
                }
            }
        });
    });
    revalidatePath('/review');
}
