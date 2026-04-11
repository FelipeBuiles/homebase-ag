import Link from "next/link";
import { Inbox } from "lucide-react";
import { ProposalCard } from "@/components/review/proposal-card";

interface Proposal {
  id: string;
  agentId: string;
  entityType: string;
  entityId: string | null;
  rationale: string | null;
  confidence: number | null;
  changes: {
    id: string;
    field: string;
    before: string | null;
    after: string | null;
  }[];
  createdAt: Date;
}

export function ContextualReviewPanel({
  title = "Pending review",
  description,
  proposals,
  entityNames = {},
}: {
  title?: string;
  description?: string;
  proposals: Proposal[];
  entityNames?: Record<string, string | undefined>;
}) {
  if (proposals.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-agent-border bg-agent-bg px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-agent-text" />
              <h2 className="text-sm font-medium text-agent-text">
                {title} ({proposals.length})
              </h2>
            </div>
            <p className="mt-1 text-xs text-agent-text/80">
              {description ?? "Agent suggestions for this page can be reviewed inline or in the full inbox."}
            </p>
          </div>
          <Link href="/review" className="text-xs font-medium text-agent-text hover:underline shrink-0">
            Open inbox
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            entityName={proposal.entityId ? entityNames[proposal.entityId] : undefined}
          />
        ))}
      </div>
    </section>
  );
}
