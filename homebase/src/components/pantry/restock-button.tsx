"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addPantryRestockToGroceriesAction } from "@/actions/pantry";

export function RestockButton({
  pantryItemId,
  name,
  quantity,
  unit,
  compact = false,
}: {
  pantryItemId: string;
  name: string;
  quantity?: number;
  unit?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const { execute, isPending } = useAction(addPantryRestockToGroceriesAction, {
    onSuccess: ({ data }) => {
      if (!data?.listId) return;
      toast.success(data.added ? "Added restock item to groceries" : "Already on grocery list", {
        action: {
          label: "View list",
          onClick: () => router.push(`/groceries/${data.listId}`),
        },
      });
    },
    onError: () => toast.error("Failed to add restock item"),
  });

  return (
    <Button
      variant="outline"
      size={compact ? "xs" : "sm"}
      disabled={isPending}
      onClick={() => execute({ pantryItemId, name, quantity, unit: unit ?? undefined })}
    >
      <ShoppingCart className="h-4 w-4" />
      {isPending ? "Adding…" : compact ? "Restock" : "Add Restock to Groceries"}
    </Button>
  );
}
