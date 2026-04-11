"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { changePasswordAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const { execute, isPending } = useAction(changePasswordAction, {
    onSuccess: ({ data }) => {
      if (data?.error) {
        setError(data.error);
      } else {
        toast.success(t("settings.password.changed"));
      }
    },
    onError: () => toast.error(t("settings.password.failed")),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError(t("settings.password.mismatch"));
      return;
    }
    execute({ currentPassword: current, newPassword: next });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-base-700">{t("settings.password.current")}</label>
        <Input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-base-700">{t("settings.password.new")}</label>
        <Input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          minLength={4}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-base-700">{t("settings.password.confirm")}</label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? t("settings.password.submitting") : t("settings.password.submit")}
      </Button>
    </form>
  );
}
