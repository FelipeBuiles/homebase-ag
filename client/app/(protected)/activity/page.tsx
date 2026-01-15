import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

const getSearchParam = (searchParams: SearchParams, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

const actionLabel = (action: string) => {
  switch (action) {
    case "proposal.accepted":
      return { label: "Accepted", variant: "default" as const };
    case "proposal.rejected":
      return { label: "Rejected", variant: "secondary" as const };
    case "proposal.failed":
      return { label: "Failed", variant: "destructive" as const };
    case "agent.run":
      return { label: "Agent Run", variant: "default" as const };
    case "agent.run.failed":
      return { label: "Agent Failed", variant: "destructive" as const };
    case "agent.vision.run":
      return { label: "Vision Run", variant: "default" as const };
    case "agent.vision.failed":
      return { label: "Vision Failed", variant: "destructive" as const };
    default:
      return { label: action, variant: "outline" as const };
  }
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const action = getSearchParam(params, "action");
  const query = getSearchParam(params, "q");

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(query
        ? {
            OR: [
              { action: { contains: query, mode: "insensitive" } },
              { details: { path: ["summary"], string_contains: query } },
              { details: { path: ["agentId"], string_contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="page-container space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Activity</h1>
          <p className="page-subtitle">Review proposal decisions and agent runs.</p>
        </div>
        <div className="page-actions">
          <Link href="/activity/metrics" className="nav-pill">
            Metrics
          </Link>
          <Badge variant="outline">{logs.length} entries</Badge>
        </div>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by action type or search summary and agent.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link href="/activity" className="nav-pill" data-active={!action}>
            All
          </Link>
          <Link href="/activity?action=proposal.accepted" className="nav-pill" data-active={action === "proposal.accepted"}>
            Accepted
          </Link>
          <Link href="/activity?action=proposal.rejected" className="nav-pill" data-active={action === "proposal.rejected"}>
            Rejected
          </Link>
          <Link href="/activity?action=proposal.failed" className="nav-pill" data-active={action === "proposal.failed"}>
            Failed
          </Link>
          <Link href="/activity?action=agent.run" className="nav-pill" data-active={action === "agent.run"}>
            Agent runs
          </Link>
          <Link href="/activity?action=agent.run.failed" className="nav-pill" data-active={action === "agent.run.failed"}>
            Agent failed
          </Link>
          <Link href="/activity?action=agent.vision.run" className="nav-pill" data-active={action === "agent.vision.run"}>
            Vision runs
          </Link>
          <Link href="/activity?action=agent.vision.failed" className="nav-pill" data-active={action === "agent.vision.failed"}>
            Vision failed
          </Link>
          <form className="ml-auto">
            <Input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Search summary or agent..."
              className="min-w-[220px]"
            />
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 stagger">
        {logs.length === 0 ? (
          <Card className="bg-card/80">
            <CardContent className="py-10 text-center text-muted-foreground">
              No activity yet.
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => {
            const details = log.details as Record<string, unknown> | null;
            const summary = details?.summary as string | undefined;
            const agentId = details?.agentId as string | undefined;
            const proposalId = details?.proposalId as string | undefined;
            const error = details?.error as string | undefined;
            const responseRaw = details?.responseRaw as string | undefined;
            const model = details?.model as string | undefined;
            const actionInfo = actionLabel(log.action);
            const trimmedResponse = responseRaw ? responseRaw.slice(0, 800) : null;
            return (
              <Card key={log.id} className="bg-card/80">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{summary ?? log.action}</CardTitle>
                      <CardDescription>
                        {agentId ? `Agent: ${agentId}` : "System"} •{" "}
                        {log.createdAt.toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  {proposalId && <div>Proposal ID: {proposalId}</div>}
                  {model && <div>Model: {model}</div>}
                  {!summary && <div>Action: {log.action}</div>}
                  {error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                      {error}
                    </div>
                  )}
                  {trimmedResponse && (
                    <pre className="whitespace-pre-wrap rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                      {trimmedResponse}
                    </pre>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
