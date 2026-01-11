import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createMealPlan } from "./actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function getMealPlans() {
  return await prisma.mealPlan.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { items: true } } }
  });
}

export default async function MealPlansPage() {
  const plans = await getMealPlans();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Meal Plans</h1>
          <p className="text-muted-foreground">Weekly menus.</p>
        </div>
        <form action={createMealPlan}>
            <input type="hidden" name="startDate" value={new Date().toISOString()} />
            <Button className="gap-2">
                <Plus size={16} /> New Plan (Current Week)
            </Button>
        </form>
      </div>

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
             <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No meal plans yet.</p>
             </div>
        )}
      </div>
    </div>
  );
}
