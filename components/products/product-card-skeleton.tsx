import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProductCardSkeletonProps = {
  layout?: "grid" | "list";
};

/** Placeholder that mirrors <ProductCard> while published products load. */
export function ProductCardSkeleton({ layout = "grid" }: ProductCardSkeletonProps) {
  if (layout === "list") {
    return (
      <div className="rounded-xl border bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col gap-4 p-3 sm:flex-row">
          <Skeleton className="aspect-[4/3] w-full shrink-0 rounded-lg sm:aspect-video sm:w-52 md:w-60" />
          <div className="flex flex-1 flex-col justify-between gap-3 py-1">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex items-center justify-between gap-4 pt-1">
              <Skeleton className="h-6 w-20" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card/60 backdrop-blur-xl">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-1 flex items-end justify-between gap-2 pt-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="size-5 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** A responsive grid of card placeholders. */
export function ProductGridSkeleton({
  count = 6,
  layout = "grid",
}: {
  count?: number;
  layout?: "grid" | "list";
}) {
  return (
    <div
      className={cn(
        layout === "list"
          ? "flex flex-col gap-4"
          : "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} layout={layout} />
      ))}
    </div>
  );
}
