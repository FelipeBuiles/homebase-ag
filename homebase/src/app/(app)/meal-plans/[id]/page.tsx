import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { getMealPlan } from "@/lib/db/queries/meal-plans";
import { listRecipes } from "@/lib/db/queries/recipes";
import { WeekGridClient } from "@/components/meal-plans/week-grid-client";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MealPlanPage({ params }: PageProps) {
  const { id } = await params;
  const [plan, recipes] = await Promise.all([
    getMealPlan(id),
    listRecipes({ parseStatus: "parsed" }),
  ]);
  if (!plan) notFound();

  return (
    <PageShell
      title={plan.name}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/meal-plans" />}>
          <ChevronLeft className="h-4 w-4" />
          All plans
        </Button>
      }
    >
      <p className="text-sm text-base-500 mb-4">
        Week of {formatDate(plan.weekStart)}
      </p>
      <WeekGridClient
        planId={plan.id}
        planName={plan.name}
        weekStart={plan.weekStart}
        initialItems={plan.items}
        recipes={recipes}
      />
    </PageShell>
  );
}
