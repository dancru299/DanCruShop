import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div>
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 pb-10 pt-8 md:pb-14 md:pt-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
          {/* Left: gallery panel */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="rounded-lg border bg-card/60 p-3 shadow-2xl shadow-foreground/5 backdrop-blur-xl">
              <Skeleton className="aspect-[16/11] w-full rounded-md" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Right: title + price aside */}
          <aside className="flex flex-col gap-4 lg:pt-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <div className="flex flex-col gap-4">
              <Skeleton className="h-12 w-full md:h-14" />
              <Skeleton className="h-12 w-2/3 md:h-14" />
              <Skeleton className="h-5 w-full max-w-md" />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-lg" />
              ))}
            </div>

            {/* Price + CTA card */}
            <div className="rounded-lg border bg-card/60 p-4 shadow-sm backdrop-blur-xl">
              <div className="mb-4 flex items-start justify-between gap-4 border-b pb-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-28" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-11 w-full rounded-md" />
              <div className="mt-4 grid gap-2 border-t pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-lg" />
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Details section */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
          <div className="mt-2 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
      </section>
    </div>
  );
}
