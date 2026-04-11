"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { setupPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

export function SetupForm() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const { execute, isPending } = useAction(setupPassword, {
    onSuccess: ({ data }) => {
      if (data?.error) {
        setError(data.error);
      } else {
        window.location.href = "/";
      }
    },
    onError: ({ error: actionError }) => {
      setError(actionError.serverError || t("auth.error.generic"));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("auth.setup.error.mismatch"));
      return;
    }

    execute({ password });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-base-900">
          {t("auth.setup.title")}
        </h1>
        <p className="text-sm text-base-500 mt-2">
          {t("auth.setup.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-base-700">
            {t("auth.setup.password")}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.setup.passwordPlaceholder")}
            required
            minLength={4}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium text-base-700">
            {t("auth.setup.confirm")}
          </label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t("auth.setup.confirmPlaceholder")}
            required
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("auth.setup.submitting") : t("auth.setup.submit")}
        </Button>
      </form>
    </div>
  );
}
