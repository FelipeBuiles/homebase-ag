import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRecipe } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getRecipe(id: string) {
    try {
        return await prisma.recipe.findUnique({
            where: { id },
            include: { ingredients: true }
        });
    } catch (error) {
        console.error("Failed to load recipe", error);
        return null;
    }
}

export default async function RecipeDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;  
  const recipe = await getRecipe(params.id);

  if (!recipe) return notFound();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link href="/recipes" className="page-eyebrow flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Recipes
          </Link>
          <h1 className="page-title">{recipe.name}</h1>
          <p className="page-subtitle">Recipe details and instructions.</p>
        </div>
        <div className="page-actions">
          <form action={deleteRecipe.bind(null, recipe.id)}>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 size={14} /> Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
            <div>
                {recipe.sourceUrl && (
                    <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                        <ExternalLink size={14} /> View Source
                    </a>
                )}
                {recipe.description && <p className="text-lg text-muted-foreground mt-4">{recipe.description}</p>}
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Instructions</h3>
                <div className="prose dark:prose-invert">
                    <p className="whitespace-pre-wrap leading-relaxed">{recipe.instructions || "No instructions provided."}</p>
                </div>
            </div>
        </div>

        {/* Sidebar / Ingredients */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Ingredients ({recipe.ingredients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map(ing => (
                <li key={ing.id} className="flex items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    {ing.quantity && <span className="font-semibold">{ing.quantity} {ing.unit} </span>}
                    {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
