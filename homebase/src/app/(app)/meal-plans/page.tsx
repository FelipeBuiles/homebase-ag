import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, Trash2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/loading-skeleton";
import { listMealPlans } from "@/lib/db/queries/meal-plans";
import { CreatePlanButton } from "@/components/meal-plans/create-plan-button";
import { formatDate } from "@/lib/utils";

export default function MealPlansPage() {
  return (
    <PageShell title="Meal Plans" action={<CreatePlanButton />}>
      <Suspense fallback={<ListSkeleton />}>
        <MealPlanList />
      </Suspense>
    </PageShell>
  );
}

async function MealPlanList() {
  const plans = await listMealPlans();

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-10 w-10" />}
        heading="No meal plans"
        description="Plan your meals for the week."
      />
    );
  }

  return (
    <div className="space-y-2">
      {plans.map((plan) => (
        <Link
          key={plan.id}
          href={`/meal-plans/${plan.id}`}
          className="flex items-center gap-3 h-14 px-4 rounded-xl border border-base-200 bg-white hover:bg-base-50 transition-colors group"
        >
          <div className="h-8 w-8 rounded flex-shrink-0 bg-base-100 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-base-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-base-800 truncate">{plan.name}</p>
            <p className="text-xs text-base-400 mt-0.5">
              Week of {formatDate(plan.weekStart)} · {plan._count.items} meal{plan._count.items === 1 ? "" : "s"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
