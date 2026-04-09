"use client";

import { ReactNode } from "react";

interface PageShellProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, action, children }: PageShellProps) {
  return (
    <div className="px-6 py-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold text-base-900">
            {title}
          </h1>
          {action && <div>{action}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
