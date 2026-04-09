"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  itemId: string;
  initialCount: number;
};

export function InventoryProposalLiveUpdates({ itemId, initialCount }: Props) {
  const router = useRouter();
  const lastCount = useRef<number | null>(initialCount);
  const [pending, setPending] = useState(false);
  const [latestCount, setLatestCount] = useState<number | null>(initialCount);

  useEffect(() => {
    const source = new EventSource(`/api/inventory/${itemId}/proposals/stream`);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: string; count?: number };
        if (payload.type === "count" && typeof payload.count === "number") {
          if (lastCount.current !== null && payload.count !== lastCount.current) {
            setPending(true);
          }
          lastCount.current = payload.count;
          setLatestCount(payload.count);
        }
      } catch {
        // Ignore invalid payloads.
      }
    };

    return () => {
      source.close();
    };
  }, [itemId, router]);

  if (!pending) return null;

  return (
    <div className="sticky top-4 z-20">
      <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-sm border-l-4 border-l-primary/60 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <span className="font-semibold text-foreground">New proposals available</span>
          <span className="text-muted-foreground">
            {typeof latestCount === "number" ? ` (${latestCount})` : ""}. Refresh to review.
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setPending(false);
            router.refresh();
          }}
        >
          Review updates
        </Button>
      </div>
    </div>
  );
}
