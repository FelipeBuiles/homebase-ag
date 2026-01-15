import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Check } from "lucide-react";
import Link from "next/link";
import { assignRecipeToSlot } from "../meal-plans/actions";
import { redirect } from "next/navigation";
import { RecipeModal } from "./RecipeModal";
import { PendingRecipeCard } from "./PendingRecipeCard";
import { isRecipePending } from "@/lib/recipes-status";
import { RecipesPolling } from "./RecipesPolling";
import { isRecipePolling } from "@/lib/recipes-polling-status";
import { RetryParsingButton } from "./RetryParsingButton";
import { RecipeImage } from "./RecipeImage";

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
  const pendingIds = recipes
    .filter((recipe) => isRecipePolling(recipe.parsingStatus))
    .map((recipe) => recipe.id);

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

  const templates = [
    { title: "Weeknight staples", description: "Quick 20 minute dinners." },
    { title: "Breakfast rotation", description: "Simple, repeatable starts." },
    { title: "Comfort favorites", description: "The meals everyone asks for." },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recipes</h1>
          <p className="page-subtitle">{planId ? "Select a recipe for your plan." : "Your personal cookbook."}</p>
        </div>
        <div className="page-actions">
          <RecipeModal />
          {!planId && (
            <Link href="/groceries" className="text-sm text-muted-foreground hover:text-primary">
              View grocery lists
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
        <RecipesPolling pendingIds={pendingIds} />
        {recipes.map((recipe) =>
          isRecipePending({
            status: recipe.status,
            parsingStatus: recipe.parsingStatus,
            name: recipe.name,
          }) ? (
            <PendingRecipeCard
              key={recipe.id}
              parsingStatus={recipe.parsingStatus}
              actions={
                planId ? null : (
                  <>
                    <Button asChild size="sm">
                      <Link href={`/recipes/${recipe.id}`}>Open</Link>
                    </Button>
                    {recipe.parsingStatus === "error" && (
                      <RetryParsingButton recipeId={recipe.id} />
                    )}
                  </>
                )
              }
            />
          ) : planId ? (
              <form key={recipe.id} action={handleSelect.bind(null, recipe.id)}>
                   <button className="w-full text-left">
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group relative">
                        <CardHeader>
                            <div className="flex gap-4">
                                <RecipeImage imageUrl={recipe.imageUrl} title={recipe.name} />
                                <div className="min-w-0 space-y-1">
                                  <CardTitle className="group-hover:text-primary transition-colors">{recipe.name}</CardTitle>
                                  <CardDescription className="line-clamp-2">{recipe.description || "No description"}</CardDescription>
                                </div>
                            </div>
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
                    <div className="flex gap-4">
                      <RecipeImage imageUrl={recipe.imageUrl} title={recipe.name} />
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="group-hover:text-primary transition-colors">{recipe.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{recipe.description || "No description"}</CardDescription>
                      </div>
                    </div>
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
        )}
        {recipes.length === 0 && (
          planId ? (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground space-y-3">
                <p className="text-lg text-foreground">No recipes yet</p>
                <p className="text-sm text-muted-foreground">Add a recipe to start building your plan.</p>
                <RecipeModal />
              </CardContent>
            </Card>
          ) : (
            <div className="col-span-full grid gap-4 md:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.title} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecipeModal />
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
