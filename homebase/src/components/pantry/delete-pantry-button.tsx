"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { deletePantryItemAction } from "@/actions/pantry";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

export function DeletePantryButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useAction(deletePantryItemAction, {
    onSuccess: () => {
      toast.success(t("pantry.delete.removed"));
      router.push("/pantry");
    },
    onError: () => toast.error(t("pantry.delete.failed")),
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        {t("pantry.delete.remove")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pantry.delete.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-base-600">
            {t("pantry.delete.description", { name: itemName })}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => execute({ id: itemId })}
              disabled={isPending}
            >
              {isPending ? t("pantry.delete.removing") : t("pantry.delete.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
