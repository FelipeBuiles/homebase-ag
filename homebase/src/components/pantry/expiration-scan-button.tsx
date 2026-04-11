"use client";

import { useAction } from "next-safe-action/hooks";
import { ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerExpirationScanAction } from "@/actions/pantry";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

export function ExpirationScanButton() {
  const { t } = useI18n();
  const { execute, isPending } = useAction(triggerExpirationScanAction, {
    onSuccess: () => toast.success(t("pantry.scan.success")),
    onError: () => toast.error(t("pantry.scan.failed")),
  });

  return (
    <Button variant="outline" size="sm" onClick={() => execute({})} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ScanLine className="h-4 w-4" />
      )}
      {t("pantry.scan.button")}
    </Button>
  );
}
