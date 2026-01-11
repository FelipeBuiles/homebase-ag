"use client";

import { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { approveSelectedChanges, rejectProposal } from "./actions";
import type { UIProposal } from "@/lib/types";
import { useRouter } from "next/navigation";

type Props = {
  proposal: UIProposal;
};

export function ProposalCard({ proposal }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState(() => proposal.changes.map((c) => c.id));
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(proposal.changes.map((c) => c.id));
  const selectNone = () => setSelectedIds([]);

  const handleApply = async () => {
    setLoading(true);
    await approveSelectedChanges(proposal.id, selectedIds);
    setLoading(false);
    router.refresh();
  };

  const handleReject = async () => {
    setLoading(true);
    await rejectProposal(proposal.id);
    setLoading(false);
    router.refresh();
  };

  const confidence = proposal.changes.length > 0 ? proposal.changes[0].confidence : null;

  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">{proposal.agentId}</Badge>
            <CardTitle className="text-xl">{proposal.summary}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {proposal.createdAt.toLocaleString()}
            </CardDescription>
          </div>
          {confidence !== null ? (
            <Badge variant={confidence > 0.8 ? "default" : "secondary"}>
              {Math.round(confidence * 100)}% Confidence
            </Badge>
          ) : (
            <Badge variant="secondary">No changes</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-sm">
          <div className="text-muted-foreground">
            {selectedIds.length} of {proposal.changes.length} changes selected
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={loading}>
              Select all
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selectNone} disabled={loading}>
              Select none
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Unselected changes will be rejected when you apply.
        </p>
        <div className="bg-secondary/30 rounded-lg p-4 font-mono text-sm space-y-4">
          {proposal.changes.map((change) => (
            <div key={change.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <AlertCircle size={16} />
                  <span>{change.rationale}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={selectedIds.includes(change.id)}
                    onCheckedChange={() => toggle(change.id)}
                  />
                  <span>Apply</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background/50 p-3 rounded border border-border/50">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Before</div>
                  <pre className="whitespace-pre-wrap text-muted-foreground">
                    {JSON.stringify(change.before, null, 2)}
                  </pre>
                </div>
                <div className="bg-background p-3 rounded border border-primary/20">
                  <div className="text-xs text-primary uppercase mb-1">After</div>
                  <pre className="whitespace-pre-wrap text-foreground">
                    {JSON.stringify(change.after, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReject}
          disabled={loading}
          className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          <X size={16} /> Reject Proposal
        </Button>
        <Button onClick={handleApply} disabled={loading || selectedIds.length === 0} className="gap-2">
          <Check size={16} /> Apply Selected
        </Button>
      </CardFooter>
    </Card>
  );
}
