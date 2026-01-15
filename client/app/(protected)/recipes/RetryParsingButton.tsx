"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { retryRecipeParsing } from "./actions";

type RetryParsingButtonProps = {
  recipeId: string;
  label?: string;
};

export function RetryParsingButton({ recipeId, label = "Retry parsing" }: RetryParsingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(async () => {
      try {
        await retryRecipeParsing(recipeId);
        toast.success("Parsing restarted", {
          description: "We’ll update the recipe when it’s ready.",
        });
        router.refresh();
      } catch {
        toast.error("Could not retry parsing");
      }
    });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleRetry} disabled={isPending}>
      {label}
    </Button>
  );
}
