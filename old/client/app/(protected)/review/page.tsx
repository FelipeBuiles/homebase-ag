import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import { UIProposal } from "@/lib/types";
import { ProposalCard } from "./ProposalCard";
import Link from "next/link";

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
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Review Inbox</h1>
          <p className="page-subtitle">Approve or reject agent proposals.</p>
        </div>
        <div className="page-actions">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {proposals.length} Pending
          </Badge>
          <Link href="/activity">
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles size={14} /> View activity
            </Button>
          </Link>
        </div>
      </header>

      <div className="space-y-6 stagger">
        {proposals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground space-y-4">
              <Check className="mx-auto h-12 w-12 text-primary/30" />
              <div className="space-y-1">
                <p className="text-lg text-foreground">All caught up</p>
                <p className="text-sm text-muted-foreground">No pending proposals right now.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/activity">
                  <Button size="sm">Review recent runs</Button>
                </Link>
                <Link href="/settings" className="text-sm text-muted-foreground hover:text-primary">
                  Adjust agent settings
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))
        )}
      </div>
    </div>
  );
}
