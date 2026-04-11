"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageShellProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}

export function PageShell({ title, description, action, backHref, backLabel, children }: PageShellProps) {
  const hasStructuredHeader = Boolean(description || action || backHref);
  const showHeaderAccent = !backHref;

  return (
    <div className="px-6 py-8 animate-rise-in">
      <div className="mx-auto w-full max-w-[78rem]">
        {hasStructuredHeader ? (
          <div className="surface-illustrated warm-glow mb-7 rounded-[1.9rem] border border-[rgba(123,89,64,0.12)] px-5 py-5 md:px-6 md:py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                {backHref && (
                  <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(123,89,64,0.12)] bg-white/70 px-3 py-1.5 text-sm font-medium text-base-700 transition-colors hover:bg-white hover:text-base-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {backLabel ?? "Back"}
                  </Link>
                )}
                {showHeaderAccent && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(123,89,64,0.1)] bg-white/60 px-3 py-1 shadow-[0_8px_18px_rgba(92,67,46,0.06)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgba(230,201,143,0.9)]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgba(126,165,107,0.92)]" />
                  </div>
                )}
                <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-base-900 md:text-[2.1rem]">
                  {title}
                </h1>
                {description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-base-600 md:text-[0.96rem]">
                    {description}
                  </p>
                )}
              </div>
              {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-base-900">
              {title}
            </h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
