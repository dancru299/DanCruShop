import { ProductGridSkeleton } from "@/components/products/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesLoading() {
  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 md:py-14">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-72 md:h-12" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <ProductGridSkeleton count={6} />
      </section>
    </div>
  );
}
