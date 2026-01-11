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
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Agent Activity</h1>
          <p className="text-muted-foreground">Review proposal decisions and agent runs.</p>
        </div>
        <Badge variant="outline">{logs.length} entries</Badge>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by action type or search summary and agent.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link href="/activity" className={`nav-pill ${!action ? "bg-secondary/70" : ""}`}>
            All
          </Link>
          <Link href="/activity?action=proposal.accepted" className={`nav-pill ${action === "proposal.accepted" ? "bg-secondary/70" : ""}`}>
            Accepted
          </Link>
          <Link href="/activity?action=proposal.rejected" className={`nav-pill ${action === "proposal.rejected" ? "bg-secondary/70" : ""}`}>
            Rejected
          </Link>
          <Link href="/activity?action=proposal.failed" className={`nav-pill ${action === "proposal.failed" ? "bg-secondary/70" : ""}`}>
            Failed
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
            const actionInfo = actionLabel(log.action);
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
                  {!summary && <div>Action: {log.action}</div>}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
