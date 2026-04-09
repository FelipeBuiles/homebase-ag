import { Activity } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { listActivityLog } from "@/lib/db/queries/proposals";
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
  const logs = await listActivityLog(100);

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
