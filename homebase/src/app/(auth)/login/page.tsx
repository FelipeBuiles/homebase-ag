"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { execute, isPending } = useAction(login, {
    onSuccess: ({ data }) => {
      if (data?.error) {
        setError(data.error);
      }
    },
    onError: ({ error: actionError }) => {
      setError(actionError.serverError || "Something went wrong");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    execute({ password });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-base-900">
          HomeBase
        </h1>
        <p className="text-sm text-base-500 mt-2">
          Enter your password to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-base-700">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
