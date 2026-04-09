"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveSelectedChanges, rejectProposal } from "../review/actions";

type ProposalChange = {
  id: string;
  confidence: number;
  rationale: string;
  before: unknown;
  after: unknown;
};

type ProposalPreview = {
  id: string;
  agentId: string;
  summary: string;
  createdAt: string;
  changes: ProposalChange[];
};

type Props = {
  proposals: ProposalPreview[];
};

export function InventoryProposalPreview({ proposals }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    proposals.reduce<Record<string, string[]>>((acc, proposal) => {
      acc[proposal.id] = proposal.changes.map((change) => change.id);
      return acc;
    }, {})
  );

  const allIds = useMemo(
    () =>
      proposals.reduce<Record<string, string[]>>((acc, proposal) => {
        acc[proposal.id] = proposal.changes.map((change) => change.id);
        return acc;
      }, {}),
    [proposals]
  );

  const toggle = (proposalId: string, changeId: string) => {
    setSelected((prev) => {
      const current = prev[proposalId] ?? [];
      const next = current.includes(changeId)
        ? current.filter((id) => id !== changeId)
        : [...current, changeId];
      return { ...prev, [proposalId]: next };
    });
  };

  const selectAll = (proposalId: string) => {
    setSelected((prev) => ({ ...prev, [proposalId]: allIds[proposalId] ?? [] }));
  };

  const selectNone = (proposalId: string) => {
    setSelected((prev) => ({ ...prev, [proposalId]: [] }));
  };

  const handleApply = async (proposalId: string) => {
    setLoadingId(proposalId);
    await approveSelectedChanges(proposalId, selected[proposalId] ?? []);
    setLoadingId(null);
    router.refresh();
  };

  const handleReject = async (proposalId: string) => {
    setLoadingId(proposalId);
    await rejectProposal(proposalId);
    setLoadingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const selectedIds = selected[proposal.id] ?? [];
        return (
          <div key={proposal.id} className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{proposal.summary}</p>
                <p className="text-xs text-muted-foreground">{proposal.createdAt}</p>
              </div>
              <Badge variant="outline">{proposal.agentId}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{selectedIds.length} of {proposal.changes.length} changes selected</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => selectAll(proposal.id)} disabled={loadingId === proposal.id}>
                  Select all
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => selectNone(proposal.id)} disabled={loadingId === proposal.id}>
                  Select none
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {proposal.changes.map((change) => (
                <div key={change.id} className="rounded-xl border border-border/60 bg-background/80 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Confidence: {(change.confidence * 100).toFixed(0)}%</span>
                    <span>{change.rationale}</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(change.id)}
                        onChange={() => toggle(proposal.id, change.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      Apply
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 text-xs">
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Before</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {JSON.stringify(change.before ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">After</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {JSON.stringify(change.after ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleReject(proposal.id)}
                disabled={loadingId === proposal.id}
              >
                Reject
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleApply(proposal.id)}
                disabled={loadingId === proposal.id || selectedIds.length === 0}
              >
                Apply selected
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
