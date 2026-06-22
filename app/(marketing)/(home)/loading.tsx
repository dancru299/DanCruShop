import { ProductGridSkeleton } from "@/components/products/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div>
      {/* Hero (split variant) */}
      <section className="border-b border-border/80">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:py-10 lg:grid-cols-[1fr_27rem] lg:items-start lg:gap-10">
          <div className="flex max-w-xl flex-col gap-4">
            <Skeleton className="h-7 w-40 rounded-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-3/4" />
              <Skeleton className="h-5 w-full max-w-md" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-40 rounded-md" />
              <Skeleton className="h-11 w-36 rounded-md" />
            </div>
            <div className="hidden gap-3 md:grid md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Why-choose trust bar */}
      <section className="border-b border-border/80 bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-6">
          <Skeleton className="h-5 w-44" />
          <div className="flex flex-wrap gap-x-6 gap-y-2 md:ml-auto">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-40" />
            ))}
          </div>
        </div>
      </section>

      {/* Featured products section */}
      <section className="border-b border-border/80 py-12 md:py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-2xl flex-col gap-3">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          <ProductGridSkeleton count={3} />
        </div>
      </section>
    </div>
  );
}
