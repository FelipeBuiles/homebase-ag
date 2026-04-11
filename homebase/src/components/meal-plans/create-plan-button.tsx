"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createMealPlanAction } from "@/actions/meal-plans";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function CreatePlanButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [weekStart, setWeekStart] = useState(
    toDateInput(getMondayOfWeek(new Date()))
  );

  const { execute, isPending } = useAction(createMealPlanAction, {
    onSuccess: ({ data }) => {
      toast.success(t("mealPlans.createPlan.created"));
      setOpen(false);
      setName("");
      router.push(`/meal-plans/${data?.plan?.id}`);
    },
    onError: () => toast.error(t("mealPlans.createPlan.failed")),
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("mealPlans.createPlan")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mealPlans.createPlan.title")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) execute({ name: name.trim(), weekStart });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-base-700">{t("mealPlans.createPlan.name")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("mealPlans.createPlan.namePlaceholder")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-base-700">{t("mealPlans.createPlan.weekStart")}</label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? t("mealPlans.createPlan.creating") : t("mealPlans.createPlan.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
