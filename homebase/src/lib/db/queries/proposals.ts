import { prisma } from "@/lib/db/client";
import type { ProposalInput } from "@/lib/agents/types";

export async function createProposal(input: ProposalInput) {
  return prisma.proposal.create({
    data: {
      agentId: input.agentId,
      entityType: input.entityType,
      entityId: input.entityId,
      patch: input.patch as object[],
      snapshot: input.snapshot as object,
      rationale: input.rationale,
      confidence: input.confidence,
      changes: {
        create: input.changes.map((c) => ({
          field: c.field,
          before: c.before,
          after: c.after,
        })),
      },
    },
    include: { changes: true },
  });
}

export async function listPendingProposals() {
  return prisma.proposal.findMany({
    where: { status: "pending" },
    include: { changes: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingProposalCount() {
  return prisma.proposal.count({ where: { status: "pending" } });
}

export async function getProposal(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: { changes: true },
  });
}

export async function resolveProposal(id: string, status: "accepted" | "rejected") {
  return prisma.proposal.update({
    where: { id },
    data: { status, resolvedAt: new Date() },
  });
}

export async function listActivityLog(limit = 50) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function writeAuditLog(entry: {
  actor: string;
  action: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      actor: entry.actor,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      meta: entry.meta as object ?? undefined,
    },
  });
}
