import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createMealPlan } from "./actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

async function getMealPlans() {
  return await prisma.mealPlan.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { items: true } } }
  });
}

export default async function MealPlansPage() {
  const plans = await getMealPlans();
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meal Plans</h1>
          <p className="page-subtitle">Weekly menus.</p>
        </div>
        <form action={createMealPlan}>
            <input type="hidden" name="startDate" value={new Date().toISOString()} />
            <Button className="gap-2">
                <Plus size={16} /> New Plan (Current Week)
            </Button>
        </form>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">This week at a glance</CardTitle>
          <CardDescription>Plan meals by day and track pantry coverage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-7">
          {weekdays.map((day) => (
            <div
              key={day}
              className="rounded-xl border border-border/70 bg-background/60 px-3 py-4 text-center"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{day}</p>
              <p className="mt-2 text-sm text-muted-foreground">No meals</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
        {plans.map((plan) => (
          <Link href={`/meal-plans/${plan.id}`} key={plan.id}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">
                    Week of {plan.startDate.toLocaleDateString()}
                </CardTitle>
                <CardDescription>{plan._count.items} meals planned</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
         {plans.length === 0 && (
             <Card className="col-span-full border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground space-y-3">
                  <p className="text-lg text-foreground">No meal plans yet</p>
                  <p className="text-sm text-muted-foreground">Create a weekly plan to connect recipes and pantry items.</p>
                  <form action={createMealPlan}>
                    <input type="hidden" name="startDate" value={new Date().toISOString()} />
                    <Button size="sm" className="gap-2">
                      <Plus size={14} /> Create current week
                    </Button>
                  </form>
                </CardContent>
             </Card>
        )}
      </div>
    </div>
  );
}
