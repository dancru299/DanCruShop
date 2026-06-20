import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getUserPurchases } from "@/lib/supabase/queries/purchases";
import { getCourseByProductId, getCourseProgress } from "@/lib/supabase/queries/courses";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard/courses");
  }

  const allPurchases = await getUserPurchases(user.id);
  const coursePurchases = allPurchases.filter(
    (p) => p.product.product_type === "course"
  );

  const courseDetails = await Promise.all(
    coursePurchases.map(async (purchase) => {
      const course = await getCourseByProductId(purchase.product.id);
      const totalLessons = course
        ? course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
        : 0;
      const progress = course
        ? await getCourseProgress(user.id, course.id)
        : [];
      const completedCount = progress.filter((p) => p.completed).length;

      return { purchase, course, totalLessons, completedCount };
    })
  );

  return (
    <main className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">DanCruShop dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal">My Courses</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          The courses you&apos;ve purchased. Pick up right where you left off.
        </p>
      </div>

      {courseDetails.length > 0 ? (
        <div className="grid gap-4">
          {courseDetails.map(({ purchase, course, totalLessons, completedCount }) => {
            const progressPct =
              totalLessons > 0
                ? Math.round((completedCount / totalLessons) * 100)
                : 0;

            return (
              <article
                key={purchase.id}
                className="flex flex-col gap-5 rounded-lg border bg-card p-5 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Course</Badge>
                    {progressPct === 100 && (
                      <Badge variant="default">Completed</Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold tracking-normal">
                      {purchase.product.title}
                    </span>
                    {totalLessons > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm text-muted-foreground">
                          {completedCount} / {totalLessons} lessons completed
                        </p>
                        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {course ? (
                    <Button
                      render={
                        <Link
                          href={`/dashboard/courses/${purchase.product.id}`}
                        />
                      }
                      nativeButton={false}
                    >
                      <BookOpenIcon data-icon="inline-start" aria-hidden="true" />
                      {completedCount > 0 ? "Continue learning" : "Start learning"}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      No content yet
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpenIcon}
          title="No courses yet"
          description="When you buy a course, it will appear here."
          action={
            <Button render={<Link href="/products" />} nativeButton={false}>
              Browse products
            </Button>
          }
        />
      )}
    </main>
  );
}
