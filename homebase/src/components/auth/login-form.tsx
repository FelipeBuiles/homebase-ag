"use client";

import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

export function LoginForm() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { execute, isPending, hasSucceeded } = useAction(login, {
    onSuccess: ({ data }) => {
      if (data?.error) {
        setError(
          data.error === "Invalid password"
            ? t("auth.login.error.invalid")
            : data.error === "No account found. Please run setup first."
              ? t("auth.login.error.noAccount")
              : data.error
        );
      }
    },
    onError: ({ error: actionError }) => {
      setError(actionError.serverError || t("auth.error.generic"));
    },
  });

  useEffect(() => {
    if (hasSucceeded) {
      window.location.href = "/";
    }
  }, [hasSucceeded]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    execute({ password });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-base-900">
          {t("auth.login.title")}
        </h1>
        <p className="text-sm text-base-500 mt-2">
          {t("auth.login.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-base-700">
            {t("auth.login.password")}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.login.placeholder")}
            required
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
      </form>
    </div>
  );
}
