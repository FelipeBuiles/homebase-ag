"use client";

import { useAction } from "next-safe-action/hooks";
import { RefreshCw } from "lucide-react";
import { retryParseAction } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

export function RetryParseButton({ recipeId }: { recipeId: string }) {
  const { t } = useI18n();
  const { execute, isPending } = useAction(retryParseAction, {
    onSuccess: () => toast.success(t("recipes.retry.success")),
    onError: () => toast.error(t("recipes.retry.failed")),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => execute({ recipeId })}
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? t("recipes.retry.running") : t("recipes.retry.button")}
    </Button>
  );
}
