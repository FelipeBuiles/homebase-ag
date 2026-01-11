import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { removeSlot } from "../actions";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Fragment } from "react";

async function getMealPlan(id: string) {
    return await prisma.mealPlan.findUnique({
        where: { id },
        include: { 
            items: { include: { recipe: true } } 
        }
    });
}

export default async function MealPlanDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const plan = await getMealPlan(params.id);
  if (!plan) return notFound();

  // Generate days of the week
  const days: Date[] = [];
  const start = new Date(plan.startDate);
  for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
  }

  const mealTypes = ["Breakfast", "Lunch", "Dinner"];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="mb-6">
        <Link href="/meal-plans" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Meal Plans
        </Link>
      </div>

      <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">
            Week of {plan.startDate.toLocaleDateString()}
          </h1>
      </div>

      <div className="overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-8 gap-4">
              {/* Header Row */}
              <div className="col-span-1"></div>
              {days.map(d => (
                  <div key={d.toISOString()} className="text-center font-semibold pb-2 border-b border-border/60">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}<br/>
                      <span className="text-sm text-muted-foreground">{d.getDate()}</span>
                  </div>
              ))}

              {/* Rows for Meal Types */}
              {mealTypes.map(type => (
                  <Fragment key={type}>
                    <div className="flex items-center justify-center font-semibold text-muted-foreground rotate-0 md:-rotate-90 md:h-32">
                        {type}
                    </div>
                    {days.map(day => {
                        // Find item for this slot
                        const item = plan.items.find(i => 
                             new Date(i.date).getDate() === day.getDate() && 
                             i.mealType === type
                        );

                        return (
                            <Card key={`${day}-${type}`} className="h-32 relative group overflow-hidden border-dashed border-2 hover:border-solid hover:border-primary/50 transition-all">
                                {item ? (
                                    <div className="p-2 h-full flex flex-col justify-between bg-accent/20">
                                        <span className="text-sm font-medium line-clamp-2">{item.recipe?.name || "Custom Meal"}</span>
                                        <form action={removeSlot.bind(null, item.id)}>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                                <X size={12} />
                                            </Button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Link href={`/recipes?selectForPlan=${plan.id}&date=${day.toISOString()}&type=${type}`}>
                                            <Button size="sm" variant="ghost">
                                                <Plus size={16} />
                                            </Button>
                                       </Link>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                  </Fragment>
              ))}
          </div>
      </div>
    </div>
  );
}
