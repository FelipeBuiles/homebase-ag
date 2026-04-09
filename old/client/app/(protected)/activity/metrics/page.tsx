import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

const getSearchParam = (searchParams: SearchParams, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

const rangeToDays = (range?: string | null) => {
  switch (range) {
    case "24h":
      return 1;
    case "30d":
      return 30;
    default:
      return 7;
  }
};

type RunStats = {
  count: number;
  success: number;
  durationMs: number;
  functionCalls: number;
  promptChars: number;
  responseChars: number;
};

const initStats = (): RunStats => ({
  count: 0,
  success: 0,
  durationMs: 0,
  functionCalls: 0,
  promptChars: 0,
  responseChars: 0,
});

export default async function ActivityMetricsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = getSearchParam(params, "range");
  const days = rangeToDays(range);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["agent.run", "agent.run.failed"] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const summary = initStats();
  const byAgent = new Map<string, RunStats>();

  logs.forEach((log) => {
    const details = log.details as Record<string, unknown> | null;
    const agentId = (details?.agentId as string | undefined) ?? "unknown";
    const model = (details?.model as string | undefined) ?? "unknown";
    const key = `${agentId}::${model}`;
    const success = Boolean(details?.success);
    const durationMs = Number(details?.durationMs ?? 0);
    const functionCalls = Number(details?.functionCalls ?? 0);
    const promptChars = Number(details?.promptChars ?? 0);
    const responseChars = Number(details?.responseChars ?? 0);

    const stats = byAgent.get(key) ?? initStats();
    stats.count += 1;
    stats.success += success ? 1 : 0;
    stats.durationMs += durationMs;
    stats.functionCalls += functionCalls;
    stats.promptChars += promptChars;
    stats.responseChars += responseChars;
    byAgent.set(key, stats);

    summary.count += 1;
    summary.success += success ? 1 : 0;
    summary.durationMs += durationMs;
    summary.functionCalls += functionCalls;
    summary.promptChars += promptChars;
    summary.responseChars += responseChars;
  });

  const rows = Array.from(byAgent.entries())
    .map(([key, stats]) => {
      const [agentId, model] = key.split("::");
      const avgDuration = stats.count ? Math.round(stats.durationMs / stats.count) : 0;
      const avgFunctionCalls = stats.count ? Math.round(stats.functionCalls / stats.count) : 0;
      const successRate = stats.count ? Math.round((stats.success / stats.count) * 100) : 0;
      return { agentId, model, stats, avgDuration, avgFunctionCalls, successRate };
    })
    .sort((a, b) => b.stats.count - a.stats.count);

  const avgDuration = summary.count ? Math.round(summary.durationMs / summary.count) : 0;
  const avgFunctionCalls = summary.count ? Math.round(summary.functionCalls / summary.count) : 0;
  const successRate = summary.count ? Math.round((summary.success / summary.count) * 100) : 0;

  return (
    <div className="page-container space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Metrics</h1>
          <p className="page-subtitle">Resource usage and execution stats for agent runs.</p>
        </div>
        <div className="page-actions">
          <Link href="/activity" className="nav-pill">
            Back to activity
          </Link>
          <Badge variant="outline">{summary.count} runs</Badge>
        </div>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Time range</CardTitle>
          <CardDescription>Metrics are computed over the selected window.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/activity/metrics?range=24h" className="nav-pill" data-active={range === "24h"}>
            24h
          </Link>
          <Link href="/activity/metrics" className="nav-pill" data-active={!range || range === "7d"}>
            7d
          </Link>
          <Link href="/activity/metrics?range=30d" className="nav-pill" data-active={range === "30d"}>
            30d
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Total runs</CardTitle>
            <CardDescription>All agent invocations</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.count}</CardContent>
        </Card>
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Success rate</CardTitle>
            <CardDescription>Valid JSON responses</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{successRate}%</CardContent>
        </Card>
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Avg duration</CardTitle>
            <CardDescription>Model execution time</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{avgDuration}ms</CardContent>
        </Card>
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Avg function calls</CardTitle>
            <CardDescription>Tool calls per run</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{avgFunctionCalls}</CardContent>
        </Card>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>By agent and model</CardTitle>
          <CardDescription>Volume and performance breakdown.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Agent</th>
                <th className="py-2">Model</th>
                <th className="py-2">Runs</th>
                <th className="py-2">Success</th>
                <th className="py-2">Avg time</th>
                <th className="py-2">Avg calls</th>
                <th className="py-2">Avg response</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-muted-foreground">
                    No agent runs in this window.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.agentId}-${row.model}`} className="border-t border-border/60">
                    <td className="py-2 pr-4 font-medium">{row.agentId}</td>
                    <td className="py-2 pr-4">{row.model}</td>
                    <td className="py-2 pr-4">{row.stats.count}</td>
                    <td className="py-2 pr-4">{row.successRate}%</td>
                    <td className="py-2 pr-4">{row.avgDuration}ms</td>
                    <td className="py-2 pr-4">{row.avgFunctionCalls}</td>
                    <td className="py-2 pr-4">
                      {row.stats.count ? Math.round(row.stats.responseChars / row.stats.count) : 0} chars
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
