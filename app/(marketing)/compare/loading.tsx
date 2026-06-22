import { Skeleton } from "@/components/ui/skeleton";

export default function CompareLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {/* Product column headers */}
        <div className="grid grid-cols-[160px_1fr_1fr] gap-4 border-b p-4 md:grid-cols-[200px_1fr_1fr_1fr]">
          <div />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Spec rows */}
        {Array.from({ length: 6 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-[160px_1fr_1fr] gap-4 border-b p-4 last:border-b-0 md:grid-cols-[200px_1fr_1fr_1fr]"
          >
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, col) => (
              <Skeleton key={col} className="h-4 w-16" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
