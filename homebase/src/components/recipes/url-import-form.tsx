"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { importFromUrl } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function UrlImportForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [url, setUrl] = useState("");

  const { execute, isPending } = useAction(importFromUrl, {
    onSuccess: ({ data }) => {
      toast.success(t("recipes.import.started"));
      router.push(`/recipes/${data?.recipe?.id}`);
    },
    onError: ({ error }) => {
      toast.error(error.validationErrors?.url?._errors?.[0] ?? t("recipes.import.failed"));
    },
  });

  return (
    <div className="rounded-2xl border border-base-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-600" />
        <p className="text-sm font-medium text-base-900">{t("recipes.import.title")}</p>
      </div>
      <p className="mt-1 text-sm text-base-600">
        {t("recipes.import.description")}
      </p>
      <form
        onSubmit={(e) => { e.preventDefault(); execute({ url }); }}
        className="mt-4 flex gap-2"
      >
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          type="url"
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? t("recipes.import.running") : t("recipes.import.button")}
        </Button>
      </form>
    </div>
  );
}
