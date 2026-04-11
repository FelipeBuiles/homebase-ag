"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const MAX_ATTEMPTS = 20;
const BASE_DELAY = 3000;

export function ParsePoller({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const attemptRef = useRef(0);

  useEffect(() => {
    attemptRef.current = 0;

    const poll = () => {
      if (attemptRef.current >= MAX_ATTEMPTS) return;
      attemptRef.current += 1;

      const delay = Math.min(BASE_DELAY * Math.pow(1.5, attemptRef.current - 1), 15_000);
      setTimeout(() => {
        if (attemptRef.current < MAX_ATTEMPTS) {
          router.refresh();
          poll();
        }
      }, delay);
    };

    poll();

    return () => {
      attemptRef.current = MAX_ATTEMPTS; // Stop polling on unmount
    };
  }, [recipeId, router]);

  return null;
}
