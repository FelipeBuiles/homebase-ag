"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type RecipesPollingProps = {
  pendingIds: string[];
  intervalMs?: number;
};

export function RecipesPolling({ pendingIds, intervalMs = 2000 }: RecipesPollingProps) {
  const router = useRouter();

  useEffect(() => {
    if (pendingIds.length === 0) return undefined;

    let isActive = true;
    const checkStatus = async () => {
      try {
        for (const recipeId of pendingIds) {
          const response = await fetch(`/api/recipes/${recipeId}`);
          if (!response.ok) continue;
          const data = await response.json();
          const status = data.parsingStatus as string | undefined;
          if (status === "filled" || status === "error") {
            if (isActive) router.refresh();
            return;
          }
        }
      } catch {
        // Ignore polling failures; user can refresh manually.
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, intervalMs);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [pendingIds, intervalMs, router]);

  return null;
}
