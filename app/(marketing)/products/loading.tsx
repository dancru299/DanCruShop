import { ProductGridSkeleton } from "@/components/products/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div>
      <section className="border-b bg-muted/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 md:py-14">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-64 md:h-12" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:flex flex-col gap-6">
            <div className="flex flex-col gap-5 rounded-xl border bg-card/60 p-5 backdrop-blur-xl">
              {Array.from({ length: 3 }).map((_, group) => (
                <div key={group} className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-20" />
                  {Array.from({ length: 4 }).map((_, item) => (
                    <Skeleton key={item} className="h-4 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-8 rounded-md lg:hidden" />
              <Skeleton className="ml-auto h-4 w-28" />
            </div>
            <ProductGridSkeleton count={9} />
          </div>
        </div>
      </section>
    </div>
  );
}
