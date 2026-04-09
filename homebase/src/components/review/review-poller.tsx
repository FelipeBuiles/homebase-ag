"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePendingCount } from "@/components/layout/pending-count-provider";

/**
 * Invisible component mounted on the review page.
 * Calls router.refresh() whenever the pending proposal count changes,
 * so new proposals appear without a manual reload.
 */
export function ReviewPoller() {
  const router = useRouter();
  const count = usePendingCount();
  const prev = useRef(count);

  useEffect(() => {
    if (count !== prev.current) {
      prev.current = count;
      router.refresh();
    }
  }, [count, router]);

  return null;
}
