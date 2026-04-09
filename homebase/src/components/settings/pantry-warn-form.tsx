"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updatePantryWarnDaysAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function PantryWarnForm({ days }: { days: number }) {
  const [value, setValue] = useState(days);

  const { execute, isPending } = useAction(updatePantryWarnDaysAction, {
    onSuccess: () => toast.success("Warning threshold updated"),
    onError: () => toast.error("Failed to save"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute({ days: value });
      }}
      className="flex items-center gap-3"
    >
      <Input
        type="number"
        min={1}
        max={365}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-24"
      />
      <span className="text-sm text-base-600">days before expiration</span>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
