import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import prisma from "@/lib/prisma";
import { UIProposal } from "@/lib/types";
import { ProposalCard } from "./ProposalCard";

// Mock data fetch for now until Prisma client is set up globally
async function getProposals(): Promise<UIProposal[]> {
  const proposals = await prisma.proposal.findMany({ 
    where: { status: 'pending' },
    include: { changes: true },
    orderBy: { createdAt: 'desc' }
  });

  return proposals.map((p) => ({
      id: p.id,
      agentId: p.agentId,
      status: p.status as UIProposal["status"],
      summary: p.summary,
      createdAt: p.createdAt,
      changes: p.changes.map(c => ({
          id: c.id,
          entityType: c.entityType,
          entityId: c.entityId,
          confidence: c.confidence,
          rationale: c.rationale,
          diff: Array.isArray(c.diff)
            ? (c.diff as unknown as UIProposal["changes"][number]["diff"])
            : [],
          before: (c.before ?? {}) as UIProposal["changes"][number]["before"],
          after: (c.after ?? {}) as UIProposal["changes"][number]["after"],
      }))
  }));
}

export default async function ReviewPage() {
  const proposals = await getProposals();

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Review Inbox</h1>
          <p className="text-muted-foreground">Approve or reject agent proposals.</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {proposals.length} Pending
        </Badge>
      </div>

      <div className="space-y-6 stagger">
        {proposals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Check className="mx-auto h-12 w-12 text-primary/20 mb-4" />
            <p className="text-lg">All caught up! No pending proposals.</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))
        )}
      </div>
    </div>
  );
}
