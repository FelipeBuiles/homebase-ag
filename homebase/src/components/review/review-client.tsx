"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  acceptProposal,
  rejectProposal,
  acceptAllProposals,
  rejectAllProposals,
  acceptProposalsByAgent,
} from "@/actions/proposals";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Change {
  id: string;
  field: string;
  before: string | null;
  after: string | null;
}

interface Proposal {
  id: string;
  agentId: string;
  entityType: string;
  entityId: string | null;
  rationale: string | null;
  confidence: number | null;
  changes: Change[];
  createdAt: Date | string;
}

interface ReviewClientProps {
  proposals: Proposal[];
  entityNames: Record<string, string | undefined>;
}

const AGENT_LABELS: Record<string, string> = {
  enrichment: "Enrichment",
  "recipe-parser": "Recipe Parser",
  expiration: "Expiration",
  normalization: "Normalization",
  chef: "Chef",
  "pantry-maintenance": "Pantry Maintenance",
};

export function ReviewClient({ proposals, entityNames }: ReviewClientProps) {
  const router = useRouter();
  const totalCount = proposals.length;

  const groups = useMemo(() => {
    const map = new Map<string, Proposal[]>();
    for (const p of proposals) {
      if (!map.has(p.agentId)) map.set(p.agentId, []);
      map.get(p.agentId)!.push(p);
    }
    return Array.from(map.entries()).map(([agentId, items]) => ({
      agentId,
      label: AGENT_LABELS[agentId] ?? agentId,
      proposals: items,
    }));
  }, [proposals]);

  const { execute: execAcceptAll, isPending: acceptingAll } = useAction(acceptAllProposals, {
    onSuccess: ({ data }) => {
      toast.success(`Applied ${data?.count ?? 0} proposals`);
      router.refresh();
    },
    onError: () => toast.error("Failed to apply some proposals"),
  });

  const { execute: execRejectAll, isPending: rejectingAll } = useAction(rejectAllProposals, {
    onSuccess: ({ data }) => {
      toast.success(`Dismissed ${data?.count ?? 0} proposals`);
      router.refresh();
    },
    onError: () => toast.error("Failed to dismiss proposals"),
  });

  const { execute: execAcceptGroup } = useAction(acceptProposalsByAgent, {
    onSuccess: ({ data }) => {
      toast.success(`Applied ${data?.count ?? 0} proposals`);
      router.refresh();
    },
    onError: () => toast.error("Failed to apply some proposals"),
  });

  const bulkPending = acceptingAll || rejectingAll;

  return (
    <div className="space-y-6">
      {/* Sticky top action bar */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-base-500">
          {totalCount} pending proposal{totalCount !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={bulkPending}
            onClick={() => execRejectAll()}
          >
            {rejectingAll ? "Dismissing..." : "Reject all"}
          </Button>
          <Button
            size="sm"
            disabled={bulkPending}
            onClick={() => execAcceptAll()}
          >
            {acceptingAll ? "Applying..." : `Accept all (${totalCount})`}
          </Button>
        </div>
      </div>

      {/* Agent groups */}
      {groups.map((group) => (
        <section key={group.agentId}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-base-500 uppercase tracking-wide">
              {group.label} &middot; {group.proposals.length}
            </h2>
            <button
              className="text-xs text-accent-600 hover:text-accent-700 font-medium disabled:opacity-50"
              disabled={bulkPending}
              onClick={() => execAcceptGroup({ agentId: group.agentId })}
            >
              Accept all {group.proposals.length}
            </button>
          </div>
          <div className="space-y-1">
            {group.proposals.map((proposal) => (
              <ProposalRow
                key={proposal.id}
                proposal={proposal}
                entityName={proposal.entityId ? entityNames[proposal.entityId] : undefined}
                disabled={bulkPending}
                onAction={() => router.refresh()}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProposalRow({
  proposal,
  entityName,
  disabled,
  onAction,
}: {
  proposal: Proposal;
  entityName?: string;
  disabled: boolean;
  onAction: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSimple = proposal.changes.length <= 2;

  const { execute: doAccept, isPending: accepting } = useAction(acceptProposal, {
    onSuccess: () => {
      toast.success("Applied");
      onAction();
    },
    onError: () => toast.error("Failed to apply"),
  });

  const { execute: doReject, isPending: rejecting } = useAction(rejectProposal, {
    onSuccess: () => {
      toast.success("Dismissed");
      onAction();
    },
    onError: () => toast.error("Failed to dismiss"),
  });

  const pending = accepting || rejecting;

  return (
    <div className="rounded-lg border border-base-200 bg-white">
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex-1 min-w-0">
          {/* Entity name */}
          {entityName && (
            <div className="text-sm font-medium text-base-800 truncate">
              {entityName}
            </div>
          )}
          {/* Inline changes for simple proposals */}
          {isSimple ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {proposal.changes.map((change) => (
                <span key={change.id} className="text-xs text-base-500">
                  <span className="font-medium text-base-600">{change.field}</span>
                  {": "}
                  {change.before && (
                    <span className="line-through text-base-400">{truncate(change.before, 40)}</span>
                  )}
                  {!change.before && <span className="text-base-400">&mdash;</span>}
                  {" \u2192 "}
                  <span className="text-base-800 font-medium">{truncate(change.after ?? "", 40)}</span>
                </span>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium mt-0.5"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {proposal.changes.length} changes
            </button>
          )}
        </div>

        {/* Per-row actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="text-xs text-base-400 hover:text-base-600 px-1.5 py-1 rounded disabled:opacity-50"
            disabled={disabled || pending}
            onClick={() => doReject({ proposalId: proposal.id })}
          >
            {rejecting ? "..." : "Dismiss"}
          </button>
          <button
            className="text-xs text-accent-600 hover:text-accent-700 font-medium px-1.5 py-1 rounded disabled:opacity-50"
            disabled={disabled || pending}
            onClick={() => doAccept({ proposalId: proposal.id })}
          >
            {accepting ? "..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Expanded view for multi-change proposals */}
      {expanded && !isSimple && (
        <div className="border-t border-base-100 px-3 py-2 space-y-1.5">
          {proposal.changes.map((change) => (
            <div key={change.id} className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-base-500 uppercase tracking-wide w-24 shrink-0">
                {change.field}
              </span>
              {change.before ? (
                <span className="text-xs text-base-400 line-through truncate">
                  {truncate(change.before, 60)}
                </span>
              ) : (
                <span className="text-xs text-base-400">&mdash;</span>
              )}
              <span className="text-xs text-base-400">{"\u2192"}</span>
              <span className="text-xs text-base-800 font-medium truncate">
                {truncate(change.after ?? "", 60)}
              </span>
            </div>
          ))}
          {proposal.rationale && (
            <p className="text-xs text-base-400 italic pt-1 border-t border-base-100">
              {proposal.rationale}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}
