import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  heading: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, heading, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-base-300 mb-4">{icon}</div>
      <h3 className="text-sm font-semibold text-base-700 mb-1">{heading}</h3>
      <p className="text-sm text-base-500 mb-4 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
