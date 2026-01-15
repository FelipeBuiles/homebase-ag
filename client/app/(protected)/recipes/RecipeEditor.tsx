"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Pencil, X } from "lucide-react";
import { formatInstructionSteps } from "@/lib/recipes-format";
import { parseIngredientLine } from "@/lib/ingredients";
import { updateRecipe } from "./actions";

const createRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type IngredientRow = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

type RecipeEditorProps = {
  recipe: {
    id: string;
    name: string;
    description: string | null;
    instructions: string | null;
    sourceUrl: string | null;
    ingredients: Array<{
      id: string;
      name: string;
      quantity: string | null;
      unit: string | null;
    }>;
  };
};

export function RecipeEditor({ recipe }: RecipeEditorProps) {
  const initialIngredients = useMemo(
    () =>
      recipe.ingredients.map((ingredient) => {
        const quantity = ingredient.quantity ?? "";
        const unit = ingredient.unit ?? "";
        if (!quantity && !unit) {
          const parsed = parseIngredientLine(ingredient.name);
          if (parsed.quantity || parsed.unit) {
            return {
              id: ingredient.id,
              name: parsed.name || ingredient.name,
              quantity: parsed.quantity,
              unit: parsed.unit,
            };
          }
        }
        return {
          id: ingredient.id,
          name: ingredient.name,
          quantity,
          unit,
        };
      }),
    [recipe.ingredients]
  );

  const displayIngredients = initialIngredients;

  const [isEditing, setIsEditing] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(initialIngredients);

  const ingredientPayload = useMemo(
    () => JSON.stringify(ingredients.map(({ id, ...rest }) => rest)),
    [ingredients]
  );

  const handleCancel = () => {
    setIngredients(initialIngredients);
    setIsEditing(false);
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: createRowId(), name: "", quantity: "", unit: "" },
    ]);
  };

  const handleRemoveIngredient = (rowId: string) => {
    setIngredients((prev) => prev.filter((row) => row.id !== rowId));
  };

  const updateIngredient = (rowId: string, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  if (!isEditing) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  <ExternalLink size={14} /> View Source
                </a>
              )}
              {recipe.description && (
                <p className="text-lg text-muted-foreground mt-4">
                  {recipe.description}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
              <Pencil size={14} /> Edit
            </Button>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Instructions</h3>
            {recipe.instructions ? (
              <ol className="space-y-3 text-sm leading-relaxed">
                {formatInstructionSteps(recipe.instructions).map((step, index) => (
                  <li key={`${recipe.id}-step-${index}`} className="flex gap-3">
                    <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No instructions provided.</p>
            )}
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Ingredients ({displayIngredients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {displayIngredients.map((ingredient) => {
                const quantityUnit = [ingredient.quantity, ingredient.unit]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                return (
                <li
                  key={ingredient.id}
                  className="flex items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    {quantityUnit && <span className="font-semibold">{quantityUnit} </span>}
                    {ingredient.name}
                  </span>
                </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form action={updateRecipe} className="grid md:grid-cols-3 gap-8">
      <input type="hidden" name="recipeId" value={recipe.id} />
      <input type="hidden" name="ingredientsJson" value={ingredientPayload} />

      <div className="md:col-span-2 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Edit Recipe</h2>
            <p className="text-sm text-muted-foreground">Update details and ingredients.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Recipe Name</Label>
            <Input id="name" name="name" defaultValue={recipe.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={recipe.description ?? ""}
              className="min-h-[96px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              defaultValue={recipe.instructions ?? ""}
              className="min-h-[180px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit">Save Changes</Button>
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Ingredients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {ingredients.map((row) => (
              <div key={row.id} className="grid gap-2 rounded-lg border border-border/60 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    aria-label="Quantity"
                    value={row.quantity}
                    onChange={(event) => updateIngredient(row.id, "quantity", event.target.value)}
                    placeholder="Qty"
                  />
                  <Input
                    aria-label="Unit"
                    value={row.unit}
                    onChange={(event) => updateIngredient(row.id, "unit", event.target.value)}
                    placeholder="Unit"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Input
                    aria-label="Ingredient"
                    value={row.name}
                    onChange={(event) => updateIngredient(row.id, "name", event.target.value)}
                    placeholder="Ingredient"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(row.id)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient}>
            Add ingredient
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
