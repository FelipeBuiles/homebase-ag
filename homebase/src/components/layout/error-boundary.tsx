"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="px-6 py-8">
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto space-y-4">
        <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-base-900">Something went wrong</h2>
          <p className="text-sm text-base-500 mt-1">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
        <Button onClick={reset} variant="outline" size="sm">
          Try again
        </Button>
      </div>
    </div>
  );
}
