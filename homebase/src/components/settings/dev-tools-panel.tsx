"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { clearAllDataAction, seedDemoDataAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

export function DevToolsPanel() {
  const router = useRouter();
  const { t } = useI18n();
  const [confirmation, setConfirmation] = useState("");

  const clearDisabled = useMemo(() => confirmation.trim() !== "CLEAR", [confirmation]);

  const seedAction = useAction(seedDemoDataAction, {
    onSuccess: () => {
      toast.success(t("settings.dev.seed.success"));
      router.refresh();
    },
    onError: () => toast.error(t("settings.dev.seed.failed")),
  });

  const clearAction = useAction(clearAllDataAction, {
    onSuccess: () => {
      toast.success(t("settings.dev.clear.success"));
      setConfirmation("");
      router.refresh();
    },
    onError: () => toast.error(t("settings.dev.clear.failed")),
  });

  return (
    <div className="space-y-5 rounded-2xl border border-base-200 bg-base-50 p-4">
      <div className="rounded-xl border border-base-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-base-900">{t("settings.dev.seed.title")}</h3>
        <p className="mt-1 text-sm text-base-600">{t("settings.dev.seed.description")}</p>
        <Button
          size="sm"
          className="mt-4"
          onClick={() => seedAction.execute()}
          disabled={seedAction.isPending}
        >
          {seedAction.isPending ? t("settings.dev.seed.running") : t("settings.dev.seed.button")}
        </Button>
      </div>

      <div className="rounded-xl border border-danger/20 bg-white p-4">
        <h3 className="text-sm font-semibold text-base-900">{t("settings.dev.clear.title")}</h3>
        <p className="mt-1 text-sm text-base-600">{t("settings.dev.clear.description")}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-base-700">{t("settings.dev.clear.label")}</label>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={t("settings.dev.clear.placeholder")}
            />
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => clearAction.execute({ confirmation: "CLEAR" })}
            disabled={clearAction.isPending || clearDisabled}
          >
            {clearAction.isPending ? t("settings.dev.clear.running") : t("settings.dev.clear.button")}
          </Button>
        </div>
      </div>

      <p className="text-xs text-base-500">{t("settings.dev.note")}</p>
    </div>
  );
}
