import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AdminListSkeletonProps = {
  /** Number of metric cards to render above the table. 0 hides the stat row. */
  metrics?: number;
  /** Column layout for the metric grid (matches the real pages). */
  metricCols?: 3 | 4;
  /** Show a placeholder for the primary action button in the header. */
  showAction?: boolean;
  /** Number of placeholder table rows. */
  rows?: number;
};

/**
 * Route-level loading placeholder for admin list pages. Mirrors the shared
 * AdminPageHeader + AdminMetric row + search + table-card layout so navigation
 * shows an instant, layout-matched shimmer. See .claude/skills/ui-design.
 */
export function AdminListSkeleton({
  metrics = 0,
  metricCols = 4,
  showAction = false,
  rows = 6,
}: AdminListSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* AdminPageHeader */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        {showAction ? <Skeleton className="h-9 w-36 shrink-0 rounded-md" /> : null}
      </div>

      {/* AdminMetric row */}
      {metrics > 0 ? (
        <div
          className={cn(
            "grid gap-3",
            metricCols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4"
          )}
        >
          {Array.from({ length: metrics }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Search + table card */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-full max-w-md rounded-md" />

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-1.5 border-b p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>

          <div>
            {Array.from({ length: rows }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b p-4 last:border-b-0"
              >
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="hidden h-4 w-16 sm:block" />
                <Skeleton className="hidden h-4 w-20 md:block" />
                <Skeleton className="size-8 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
