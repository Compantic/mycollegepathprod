import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-button bg-secondary-200", className)}
      {...props}
    />
  );
}

/** Shimmer variant for loading states */
function SkeletonShimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-button skeleton-shimmer", className)}
      {...props}
    />
  );
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-card border border-bg-border bg-bg-card overflow-hidden", className)} {...props}>
      <SkeletonShimmer className="h-32 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { rows?: number; cols?: number }) {
  return (
    <div className={cn("rounded-card border border-bg-border overflow-hidden", className)} {...props}>
      <div className="flex border-b border-bg-border bg-secondary-100/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1 m-2 rounded-button" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex border-b border-bg-border last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-12 flex-1 m-2 rounded-button" />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonShimmer, SkeletonCard, SkeletonTable };
