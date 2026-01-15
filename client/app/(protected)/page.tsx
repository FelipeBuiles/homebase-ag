import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Inbox, Package, ShoppingCart, Utensils, Box, Calendar, type LucideIcon } from "lucide-react";
import { getAppConfig } from "@/lib/settings";
import prisma from "@/lib/prisma";

const FeatureCard = ({
  href,
  title,
  description,
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}) => (
  <Link href={href} className="block group">
    <Card className="h-full transition-colors hover:border-primary/40">
      <CardHeader className="flex flex-row gap-4">
        <div className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary">
          <Icon size={20} />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
      </CardHeader>
    </Card>
  </Link>
);

export default async function Home() {
  const config = await getAppConfig();
  const recentActivity = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  const pendingCount = await prisma.proposal.count({
    where: { status: "pending" },
  });
  const steps = [
    {
      label: "Setup complete",
      done: Boolean(config?.setupComplete),
      note: "Base configuration saved.",
    },
    {
      label: "Password protection",
      done: Boolean(config?.passwordHash),
      note: config?.passwordHash ? "Password enabled." : "Optional, can be added later.",
    },
    {
      label: "Database connection",
      done: true,
      note: "Postgres reachable from the app.",
    },
    {
      label: "Agents running",
      done: false,
      note: "Use `npm run dev:all` to start agents.",
    },
  ];

  const pendingLabel = pendingCount === 1 ? "proposal" : "proposals";

  return (
    <main className="page-container">
      <header className="page-header">
        <div className="space-y-4">
          <Badge variant="secondary" className="uppercase tracking-[0.3em] text-xs px-4 py-1">
            Calm MVP
          </Badge>
          <div className="space-y-3">
            <h1 className="page-title">
              Good morning, <span className="text-primary italic">HomeBase</span>.
            </h1>
            <p className="page-subtitle max-w-2xl">
              {pendingCount > 0
                ? `Everything is in its place. You have ${pendingCount} ${pendingLabel} waiting for review.`
                : "Everything is in its place. No proposals waiting for review."}
            </p>
          </div>
        </div>
        <div className="page-actions">
          <Link href="/review">
            <Button className="gap-2">
              <Inbox size={16} /> Review proposals
            </Button>
          </Link>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {pendingCount} pending
          </Badge>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Core modules</p>
              <h2 className="text-xl font-semibold">Manage your household</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              href="/inventory"
              title="Inventory"
              description="Manage items with rooms, categories, and tags."
              icon={Package}
            />
            <FeatureCard
              href="/groceries"
              title="Groceries"
              description="Smart shopping lists that learn what you need."
              icon={ShoppingCart}
            />
            <FeatureCard
              href="/pantry"
              title="Pantry"
              description="Track stock levels and expiration dates."
              icon={Box}
            />
            <FeatureCard
              href="/recipes"
              title="Recipes"
              description="Organize your favorite meals and instructions."
              icon={Utensils}
            />
            <FeatureCard
              href="/meal-plans"
              title="Meal Plans"
              description="Weekly planning linked to your pantry."
              icon={Calendar}
            />
          </div>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Review Inbox</CardTitle>
                <Badge variant={pendingCount > 0 ? "default" : "outline"}>
                  {pendingCount} pending
                </Badge>
              </div>
              <CardDescription>
                {pendingCount > 0
                  ? "Your AI agents have suggestions ready for approval."
                  : "All caught up. Check activity for historical runs."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link href="/review">
                <Button size="sm">Open inbox</Button>
              </Link>
              <Link href="/activity" className="text-sm text-muted-foreground hover:text-primary">
                View activity
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Quick start checklist</CardTitle>
                  <CardDescription>Finish these steps to fully enable HomeBase.</CardDescription>
                </div>
                <Badge variant="secondary">Setup</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {steps.map((step) => (
                <div
                  key={step.label}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3"
                >
                  <div
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      step.done ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.note}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Recent agent activity</CardTitle>
                  <CardDescription>Latest proposal decisions and runs.</CardDescription>
                </div>
                <Link href="/activity" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-sm text-muted-foreground">No activity yet.</div>
              ) : (
                recentActivity.map((log) => {
                  const details = log.details as Record<string, unknown> | null;
                  const summary = details?.summary as string | undefined;
                  const agentId = details?.agentId as string | undefined;
                  return (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{summary ?? log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {agentId ? `Agent: ${agentId}` : "System"} • {log.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {log.action.replace("proposal.", "")}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
