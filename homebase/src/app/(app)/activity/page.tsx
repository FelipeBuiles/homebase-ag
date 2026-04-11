import { Activity } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { listActivityLog } from "@/lib/db/queries/proposals";
import { getActivityMetrics, getDbStats } from "@/lib/db/queries/settings";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const actionStyles: Record<string, { dot: string; label: string }> = {
  "proposal.accepted": { dot: "bg-success", label: "Accepted" },
  "proposal.rejected": { dot: "bg-danger", label: "Rejected" },
  "proposal.created": { dot: "bg-warning", label: "Proposed" },
  "proposal.change.accepted": { dot: "bg-success", label: "Field applied" },
  "job.failed": { dot: "bg-danger", label: "Failed" },
};

export default async function ActivityPage() {
  const [logs, metrics, stats] = await Promise.all([
    listActivityLog(100),
    getActivityMetrics(),
    getDbStats(),
  ]);

  if (logs.length === 0) {
    return (
      <PageShell title="Activity">
        <EmptyState
          icon={<Activity className="h-10 w-10" />}
          heading="No activity yet"
          description="Actions and agent events will be logged here."
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Activity">
      {/* Metrics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-base-200 bg-white p-3">
          <p className="text-2xl font-semibold text-base-900 tabular-nums">{stats.proposals.pending}</p>
          <p className="text-xs text-base-500 mt-0.5">Pending proposals</p>
        </div>
        <div className="rounded-lg border border-base-200 bg-white p-3">
          <p className="text-2xl font-semibold text-success tabular-nums">{stats.proposals.accepted}</p>
          <p className="text-xs text-base-500 mt-0.5">Accepted</p>
        </div>
        <div className="rounded-lg border border-base-200 bg-white p-3">
          <p className="text-2xl font-semibold text-danger tabular-nums">{stats.proposals.rejected}</p>
          <p className="text-xs text-base-500 mt-0.5">Rejected</p>
        </div>
        <div className="rounded-lg border border-base-200 bg-white p-3">
          <p className="text-2xl font-semibold text-base-900 tabular-nums">{metrics.byAgent.length}</p>
          <p className="text-xs text-base-500 mt-0.5">Active agents</p>
        </div>
      </div>

      {/* Agent breakdown */}
      {metrics.byAgentProposals.length > 0 && (
        <div className="rounded-lg border border-base-200 bg-white p-4 mb-6">
          <h3 className="text-sm font-semibold text-base-900 mb-3">Proposals by agent</h3>
          <div className="space-y-2">
            {metrics.byAgentProposals.map((entry) => {
              const maxCount = Math.max(...metrics.byAgentProposals.map((e) => e._count.agentId), 1);
              const width = Math.min(Math.max((entry._count.agentId / maxCount) * 100, 8), 100);
              return (
                <div key={entry.agentId} className="flex items-center justify-between">
                  <span className="text-sm text-base-700">{entry.agentId}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-accent-500" style={{ width: `${width}px` }} />
                    <span className="text-xs text-base-500 tabular-nums w-6 text-right">{entry._count.agentId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-base-200 bg-white overflow-hidden divide-y divide-base-100">
        {logs.map((log) => {
          const style = actionStyles[log.action] ?? { dot: "bg-base-300", label: log.action };
          return (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3">
              <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", style.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-base-800">{style.label}</span>
                  <span className="text-xs text-base-400">by {log.actor}</span>
                  {log.entityType && log.entityId && (
                    <span className="text-xs text-base-400 truncate">
                      · {log.entityType} {log.entityId.slice(-6)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-base-400 mt-0.5">{formatDate(log.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
