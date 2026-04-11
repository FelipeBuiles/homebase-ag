import Link from "next/link";
import Image from "next/image";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PantryRecipeSuggestionSections } from "@/lib/recipes/pantry-coverage";
import { AddToGroceriesButton } from "@/components/recipes/add-to-groceries-button";

export function CookFromPantry({
  sections,
}: {
  sections: PantryRecipeSuggestionSections;
}) {
  const hasAny =
    sections.cookNow.length > 0 ||
    sections.useSoon.length > 0 ||
    sections.almostThere.length > 0;

  if (!hasAny) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cook From Pantry</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-base-500">
            Add pantry items and parsed recipes to unlock pantry-based cooking suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cook From Pantry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Section
          title="Cook now"
          description="Recipes fully covered by pantry."
          items={sections.cookNow}
        />
        <Section
          title="Use soon"
          description="Recipes that help use expiring items."
          items={sections.useSoon}
        />
        <Section
          title="Almost there"
          description="Recipes closest to ready with only a few gaps."
          items={sections.almostThere}
        />
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: PantryRecipeSuggestionSections[keyof PantryRecipeSuggestionSections];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium text-base-800">{title}</h3>
        <p className="text-xs text-base-500">{description}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.recipeId} className="rounded-lg border border-base-200 bg-base-50/60 p-3">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-base-200 bg-white">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ChefHat className="h-4 w-4 text-base-400" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="space-y-1">
                  <Link href={`/recipes/${item.recipeId}`} className="text-sm font-medium text-base-800 hover:text-accent-600">
                    {item.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={item.coverage.cookNow ? "success" : "default"} className="text-[10px]">
                      {item.coverage.cookNow
                        ? "Cook now"
                        : `${item.coverage.coveredIngredientCount + item.coverage.partialIngredientCount}/${item.coverage.ingredientCount} matched`}
                    </Badge>
                    {item.coverage.partialIngredientCount > 0 && (
                      <Badge variant="warning" className="text-[10px]">
                        {item.coverage.partialIngredientCount} partial
                      </Badge>
                    )}
                    {item.coverage.expiringMatchCount > 0 && (
                      <Badge variant="warning" className="text-[10px]">
                        Uses {item.coverage.expiringMatchCount} expiring
                      </Badge>
                    )}
                    {item.coverage.missingIngredientCount > 0 && (
                      <span className="text-xs text-base-500">
                        Missing {item.coverage.missingIngredientCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/recipes/${item.recipeId}`} />}>
                    View recipe
                  </Button>
                  {item.coverage.missingIngredientCount > 0 && (
                    <AddToGroceriesButton
                      recipeId={item.recipeId}
                      ingredientCount={item.coverage.missingIngredientCount}
                      mode="missing"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
