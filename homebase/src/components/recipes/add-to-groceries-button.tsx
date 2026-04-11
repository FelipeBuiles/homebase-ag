"use client";

import { useAction } from "next-safe-action/hooks";
import { ShoppingCart } from "lucide-react";
import { addRecipeToGroceriesAction } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddToGroceriesButton({
  recipeId,
  ingredientCount,
  mode = "all",
}: {
  recipeId: string;
  ingredientCount: number;
  mode?: "all" | "missing";
}) {
  const router = useRouter();
  const { execute, isPending } = useAction(addRecipeToGroceriesAction, {
    onSuccess: ({ data }) => {
      if (data?.listId) {
        if ((data.addedCount ?? 0) === 0) {
          toast.success(
            mode === "missing"
              ? "All ingredients are already covered by pantry or groceries"
              : "Nothing new to add to groceries"
          );
          return;
        }

        toast.success(
          mode === "missing"
            ? `Added ${data.addedCount} missing ingredient${data.addedCount === 1 ? "" : "s"} to groceries`
            : "Ingredients added to grocery list",
          {
            action: {
              label: "View list",
              onClick: () => router.push(`/groceries/${data.listId}`),
            },
          }
        );
      }
    },
    onError: () => toast.error("Failed to add to groceries"),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending || ingredientCount === 0}
      onClick={() => execute({ recipeId, mode })}
    >
      <ShoppingCart className="h-4 w-4" />
      {isPending ? "Adding…" : mode === "missing" ? "Add Missing to Groceries" : "Add to Groceries"}
    </Button>
  );
}
