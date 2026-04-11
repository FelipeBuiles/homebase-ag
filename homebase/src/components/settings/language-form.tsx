"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updateLocaleAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

const LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
] as const;

export function LanguageForm({ locale }: { locale: "en" | "es" | "fr" }) {
  const router = useRouter();
  const { t } = useI18n();
  const [value, setValue] = useState(locale);

  const { execute, isPending } = useAction(updateLocaleAction, {
    onSuccess: () => {
      toast.success(t("settings.language.updated"));
      router.refresh();
    },
    onError: () => toast.error(t("settings.language.failed")),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        execute({ locale: value });
      }}
      className="flex items-center gap-3"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-base-700">{t("settings.language.label")}</label>
        <select
          value={value}
          onChange={(event) => setValue(event.target.value as typeof value)}
          className="h-8 min-w-44 ml-4 rounded-lg border border-base-200 bg-white px-2.5 text-sm text-base-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
        >
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="self-end">
        {isPending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
