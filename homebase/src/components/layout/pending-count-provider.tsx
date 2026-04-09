"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

const PendingCountContext = createContext(0);

export function usePendingCount() {
  return useContext(PendingCountContext);
}

export function PendingCountProvider({
  initial,
  children,
}: {
  initial: number;
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(initial);
  const prevCount = useRef(initial);
  const pathname = usePathname();

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/proposals/count");
        if (!res.ok) return;
        const data = await res.json();
        const next: number = data.count;

        if (next > prevCount.current && !pathname.startsWith("/review")) {
          toast(`${next} proposal${next === 1 ? "" : "s"} ready for review`, {
            action: { label: "Review", onClick: () => { window.location.href = "/review"; } },
            duration: 8000,
          });
        }

        prevCount.current = next;
        setCount(next);
      } catch {
        // silently ignore polling errors
      }
    };

    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <PendingCountContext.Provider value={count}>
      {children}
    </PendingCountContext.Provider>
  );
}
