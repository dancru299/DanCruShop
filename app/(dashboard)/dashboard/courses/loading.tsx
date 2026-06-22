import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <main className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-56" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-1.5 w-48 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        ))}
      </div>
    </main>
  );
}
