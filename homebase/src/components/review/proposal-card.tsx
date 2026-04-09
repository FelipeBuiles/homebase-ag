"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { acceptProposal, rejectProposal, acceptChange } from "@/actions/proposals";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Change {
  id: string;
  field: string;
  before: string | null;
  after: string | null;
}

interface ProposalCardProps {
  proposal: {
    id: string;
    agentId: string;
    entityType: string;
    entityId: string | null;
    rationale: string | null;
    confidence: number | null;
    changes: Change[];
    createdAt: Date;
  };
  entityName?: string;
}

export function ProposalCard({ proposal, entityName }: ProposalCardProps) {
  const [rationaleExpanded, setRationaleExpanded] = useState(false);
  const confidencePct = proposal.confidence != null
    ? Math.round(proposal.confidence * 100)
    : null;

  const { execute: accept, isPending: accepting } = useAction(acceptProposal, {
    onSuccess: () => toast.success("Changes applied"),
    onError: () => toast.error("Failed to apply changes"),
  });

  const { execute: reject, isPending: rejecting } = useAction(rejectProposal, {
    onSuccess: () => toast.success("Proposal dismissed"),
    onError: () => toast.error("Failed to reject proposal"),
  });

  const { execute: acceptOne } = useAction(acceptChange, {
    onSuccess: () => toast.success("Field updated"),
    onError: () => toast.error("Failed to apply change"),
  });

  const isPending = accepting || rejecting;

  return (
    <div className="rounded-lg border border-agent-border bg-agent-bg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-agent-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-agent-text" />
          <span className="text-sm font-medium text-agent-text">
            {agentLabel(proposal.agentId)}
          </span>
          {entityName && (
            <span className="text-sm text-agent-text/70">— {entityName}</span>
          )}
        </div>
        {confidencePct != null && (
          <span className="text-xs text-agent-text/70 tabular-nums">
            Confidence: {confidencePct}%
          </span>
        )}
      </div>

      {/* Changes */}
      <div className="divide-y divide-agent-border">
        {proposal.changes.map((change) => (
          <div key={change.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-medium text-agent-text uppercase tracking-wide">
                  {change.field}
                </span>
                {change.before && (
                  <span className="text-xs text-base-400 line-through truncate">
                    {change.before}
                  </span>
                )}
                <span className="text-xs">→</span>
                <span className="text-xs text-base-800 font-medium truncate">
                  {change.after}
                </span>
              </div>
            </div>
            <button
              onClick={() => acceptOne({ proposalId: proposal.id, field: change.field })}
              className="text-xs text-accent-600 hover:text-accent-700 font-medium shrink-0"
            >
              Apply
            </button>
          </div>
        ))}
      </div>

      {/* Rationale */}
      {proposal.rationale && (
        <div className="px-4 py-2.5 border-t border-agent-border">
          <button
            onClick={() => setRationaleExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-agent-text/70 hover:text-agent-text"
          >
            {rationaleExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Rationale
          </button>
          {rationaleExpanded && (
            <p className="mt-1.5 text-xs text-agent-text italic leading-relaxed">
              {proposal.rationale}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-agent-border bg-white/30">
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => reject({ proposalId: proposal.id })}
          className="text-base-500 hover:text-base-700"
        >
          {rejecting ? "Rejecting..." : "Reject all"}
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => accept({ proposalId: proposal.id })}
        >
          {accepting ? "Applying..." : "Accept all"}
        </Button>
      </div>
    </div>
  );
}

function agentLabel(agentId: string): string {
  const labels: Record<string, string> = {
    enrichment: "Enrichment agent",
    "recipe-parser": "Recipe parser",
    expiration: "Expiration agent",
    normalization: "Normalization agent",
    chef: "Chef agent",
    "pantry-maintenance": "Pantry maintenance",
  };
  return labels[agentId] ?? agentId;
}
