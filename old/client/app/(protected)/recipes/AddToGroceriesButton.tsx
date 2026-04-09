"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addRecipeIngredientsToGroceriesAction } from "./actions";

type AddToGroceriesButtonProps = {
  recipeId: string;
  label?: string;
};

export function AddToGroceriesButton({ recipeId, label = "Add to groceries" }: AddToGroceriesButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await addRecipeIngredientsToGroceriesAction(recipeId);
        toast.success("Added to groceries", {
          description: `Added ${result.addedCount}, merged ${result.mergedCount}.`,
        });
      } catch {
        toast.error("Could not add ingredients");
      }
    });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {label}
    </Button>
  );
}
