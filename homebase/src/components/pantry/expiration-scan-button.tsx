"use client";

import { useAction } from "next-safe-action/hooks";
import { ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerExpirationScanAction } from "@/actions/pantry";
import { toast } from "sonner";

export function ExpirationScanButton() {
  const { execute, isPending } = useAction(triggerExpirationScanAction, {
    onSuccess: () => toast.success("Expiration scan queued — check Review for results"),
    onError: () => toast.error("Failed to queue scan"),
  });

  return (
    <Button variant="outline" size="sm" onClick={() => execute({})} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ScanLine className="h-4 w-4" />
      )}
      Scan for expiring
    </Button>
  );
}
