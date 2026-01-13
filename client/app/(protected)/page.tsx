import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="h-full transition-all duration-300 hover:shadow-md hover:border-primary/50 group-hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon size={24} />
          </div>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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

  return (
    <main className="min-h-screen p-8 md:p-12 lg:p-16 max-w-7xl mx-auto">
      <div className="mb-12 space-y-6">
        <Badge variant="secondary" className="uppercase tracking-[0.3em] text-xs px-4 py-1">
          Calm MVP
        </Badge>
        <h1 className="text-4xl md:text-6xl font-semibold text-foreground leading-tight">
          Good morning, <span className="text-primary italic">HomeBase</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Everything is in its place. You have <span className="text-foreground font-medium">3 proposals</span> waiting for review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
        {/* Review Inbox - Primary Action */}
        <div className="lg:col-span-3">
          <Link href="/review" className="block group">
            <Card className="bg-secondary/60 border-primary/30 hover:border-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-soft">
                  <Inbox size={24} />
                </div>
                <div>
                  <CardTitle>Review Inbox</CardTitle>
                  <CardDescription>Your AI agents have suggestions for you.</CardDescription>
                </div>
                <Badge className="ml-auto text-lg px-3 py-1" variant="default">3 Pending</Badge>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Feature Cards */}
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

      <section className="mt-12">
        <Card className="bg-card/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Quick start checklist</CardTitle>
                <CardDescription>Finish these steps to fully enable your HomeBase instance.</CardDescription>
              </div>
              <Badge variant="secondary">Setup</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {steps.map((step) => (
              <div
                key={step.label}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
              >
                <div
                  className={`mt-1 h-3 w-3 rounded-full ${
                    step.done ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.note}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-12">
        <Card className="bg-card/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Recent agent activity</CardTitle>
                <CardDescription>Latest proposal decisions and runs.</CardDescription>
              </div>
              <Link href="/activity" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground">No activity yet.</div>
            ) : (
              recentActivity.map((log) => {
                const details = log.details as Record<string, unknown> | null;
                const summary = details?.summary as string | undefined;
                const agentId = details?.agentId as string | undefined;
                return (
                  <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{summary ?? log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {agentId ? `Agent: ${agentId}` : "System"} • {log.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">{log.action.replace("proposal.", "")}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
