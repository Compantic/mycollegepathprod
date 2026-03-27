import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  "aria-label"?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  "aria-label": ariaLabel = "Progress",
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  return (
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={ariaLabel}>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-secondary-200">
        <div
          className={cn("h-full rounded-pill bg-primary-500 transition-[width] duration-300 ease-out", barClassName)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-text-muted">
          {Math.round(percent)}%
        </p>
      )}
    </div>
  );
}
