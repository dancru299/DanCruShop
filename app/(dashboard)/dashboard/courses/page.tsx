import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
          Các khoá học bạn đã mua. Tiếp tục học từ nơi bạn dừng lại.
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
                          {completedCount} / {totalLessons} bài học hoàn thành
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
                      {completedCount > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Chưa có nội dung
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-80 flex-col items-center justify-center gap-5 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <BookOpenIcon aria-hidden="true" />
          </div>
          <div className="flex max-w-md flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-normal">
              Chưa có khoá học nào
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Khi bạn mua một khoá học, nó sẽ xuất hiện tại đây.
            </p>
          </div>
          <Button render={<Link href="/products" />} nativeButton={false}>
            Khám phá sản phẩm
          </Button>
        </div>
      )}
    </main>
  );
}
