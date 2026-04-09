"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NEW_ROUTES: Record<string, string> = {
  "/inventory": "/inventory/new",
  "/pantry": "/pantry/new",
  "/recipes": "/recipes/new",
};

const SHORTCUTS = [
  { key: "n", description: "Create new item (context-aware)" },
  { key: "?", description: "Show keyboard shortcuts" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement).isContentEditable) return;

      if (e.key === "?") {
        setHelpOpen((v) => !v);
        return;
      }

      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        // Find the best matching route
        const route = Object.entries(NEW_ROUTES).find(([prefix]) =>
          pathname.startsWith(prefix)
        );
        if (route) {
          router.push(route[1]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <kbd className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded border border-base-300 bg-base-50 text-xs font-mono text-base-700">
                {s.key}
              </kbd>
              <span className="text-sm text-base-600">{s.description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
