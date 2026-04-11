"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createGroceryListAction } from "@/actions/groceries";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

export function CreateListButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { execute, isPending } = useAction(createGroceryListAction, {
    onSuccess: ({ data }) => {
      toast.success(t("groceries.createList.created"));
      setOpen(false);
      setName("");
      router.push(`/groceries/${data?.list?.id}`);
    },
    onError: () => toast.error(t("groceries.createList.failed")),
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("groceries.createList")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("groceries.createList.title")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) execute({ name: name.trim() });
            }}
            className="space-y-4"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groceries.createList.placeholder")}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? t("groceries.createList.creating") : t("groceries.createList.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
