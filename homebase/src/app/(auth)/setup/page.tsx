"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { setupPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetupPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const { execute, isPending } = useAction(setupPassword, {
    onError: ({ error: actionError }) => {
      setError(actionError.serverError || "Something went wrong");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    execute({ password });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-base-900">
          Welcome to HomeBase
        </h1>
        <p className="text-sm text-base-500 mt-2">
          Set a password to get started.
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
            placeholder="At least 4 characters"
            required
            minLength={4}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium text-base-700">
            Confirm password
          </label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Setting up..." : "Set password"}
        </Button>
      </form>
    </div>
  );
}
