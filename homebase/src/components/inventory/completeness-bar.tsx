import { cn } from "@/lib/utils";

interface CompletenessBarProps {
  value: number;
  showLabel?: boolean;
  className?: string;
}

export function CompletenessBar({ value, showLabel = false, className }: CompletenessBarProps) {
  const color =
    value >= 80
      ? "bg-success"
      : value >= 50
      ? "bg-warning"
      : "bg-base-300";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 rounded-full bg-base-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-base-400 tabular-nums">{value}%</span>
      )}
    </div>
  );
}
