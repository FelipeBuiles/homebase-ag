import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Utensils, Check } from "lucide-react";
import Link from "next/link";
import { assignRecipeToSlot } from "../meal-plans/actions";
import { redirect } from "next/navigation";

async function getRecipes() {
  return await prisma.recipe.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { ingredients: true } } }
  });
}

type SearchParams = Record<string, string | string[] | undefined>;

function getSearchParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function RecipesPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const recipes = await getRecipes();

  // If selecting for a plan
  const planId = getSearchParam(searchParams, "selectForPlan");
  const dateStr = getSearchParam(searchParams, "date");
  const mealType = getSearchParam(searchParams, "type");

  const handleSelect = async (recipeId: string) => {
      'use server';
      if (planId && dateStr && mealType) {
          await assignRecipeToSlot(planId, new Date(dateStr), mealType, recipeId);
          redirect(`/meal-plans/${planId}`);
      }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Recipes</h1>
          <p className="text-muted-foreground">{planId ? "Select a recipe for your plan." : "Your personal cookbook."}</p>
        </div>
        <Link href="/recipes/new">
          <Button className="gap-2">
            <Plus size={16} /> Add Recipe
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
        {recipes.map((recipe) => (
          planId ? (
              <form key={recipe.id} action={handleSelect.bind(null, recipe.id)}>
                   <button className="w-full text-left">
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group relative">
                        <CardHeader>
                            <CardTitle className="group-hover:text-primary transition-colors">{recipe.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{recipe.description || "No description"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Utensils size={14} />
                                <span>{recipe._count.ingredients} ingredients</span>
                            </div>
                        </CardContent>
                        <div className="absolute top-4 right-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check />
                        </div>
                    </Card>
                   </button>
              </form>
          ) : (
            <Link href={`/recipes/${recipe.id}`} key={recipe.id}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors">{recipe.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{recipe.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Utensils size={14} />
                        <span>{recipe._count.ingredients} ingredients</span>
                    </div>
                </CardContent>
                </Card>
            </Link>
          )
        ))}
        {recipes.length === 0 && (
             <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No recipes yet. Add one to get started!</p>
             </div>
        )}
      </div>
    </div>
  );
}
