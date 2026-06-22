import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-12 md:py-16">
          <Skeleton className="h-4 w-32" />
          <div className="flex max-w-3xl flex-col gap-4">
            <Skeleton className="h-12 w-full md:h-16" />
            <Skeleton className="h-12 w-3/4 md:h-16" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border bg-card/60 backdrop-blur-xl"
            >
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="flex flex-col gap-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
