import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="grid overflow-hidden rounded-lg border bg-card shadow-sm md:grid-cols-[14rem_1fr]"
          >
            <Skeleton className="aspect-[16/10] rounded-none md:aspect-auto" />
            <div className="flex flex-col gap-5 p-5">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                <Skeleton className="h-9 w-32 rounded-md" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
