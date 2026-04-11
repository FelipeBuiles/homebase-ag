"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { updatePantryStatusAction } from "@/actions/pantry";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type PantryLifecycleStatus } from "@/lib/pantry-utils";

const actions: { status: PantryLifecycleStatus; label: string }[] = [
  { status: "consumed", label: "Consumed" },
  { status: "discarded", label: "Discarded" },
  { status: "out_of_stock", label: "Out of stock" },
];

export function StatusActions({ itemId, currentStatus }: { itemId: string; currentStatus: PantryLifecycleStatus }) {
  const router = useRouter();
  const { execute, isPending } = useAction(updatePantryStatusAction, {
    onSuccess: () => { toast.success("Status updated"); router.refresh(); },
    onError: () => toast.error("Failed to update"),
  });

  if (currentStatus !== "in_stock") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-6"
        disabled={isPending}
        onClick={() => execute({ id: itemId, status: "in_stock" })}
      >
        Back in stock
      </Button>
    );
  }

  return (
    <div className="flex gap-1">
      {actions.map((a) => (
        <Button
          key={a.status}
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          disabled={isPending}
          onClick={() => execute({ id: itemId, status: a.status })}
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
