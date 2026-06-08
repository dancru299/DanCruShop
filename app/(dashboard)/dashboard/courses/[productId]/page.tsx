import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, CheckCircle2Icon, CircleIcon, LockIcon, PlayCircleIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkUserAccess } from "@/lib/supabase/queries/purchases";
import {
  getCourseByProductId,
  getCourseProgress,
  type CourseModule,
  type Lesson,
  type LessonProgress,
} from "@/lib/supabase/queries/courses";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CourseOverviewPageProps = {
  params: Promise<{ productId: string }>;
};

function getFirstIncompleteLessonId(
  modules: CourseModule[],
  progress: LessonProgress[]
): string | null {
  const completedIds = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      if (!completedIds.has(lesson.id)) return lesson.id;
    }
  }

  return null;
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {completed} / {total} bài học hoàn thành
        </span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  productId,
  isCompleted,
  isLocked,
}: {
  lesson: Lesson;
  productId: string;
  isCompleted: boolean;
  isLocked: boolean;
}) {
  const href = `/dashboard/courses/${productId}/lessons/${lesson.id}`;

  return (
    <Link
      href={isLocked ? "#" : href}
      aria-disabled={isLocked}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        isLocked
          ? "pointer-events-none text-muted-foreground/50"
          : "hover:bg-muted",
        isCompleted && "text-muted-foreground"
      )}
    >
      {isCompleted ? (
        <CheckCircle2Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
      ) : isLocked ? (
        <LockIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/40" />
      ) : (
        <PlayCircleIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={cn("flex-1 truncate", isCompleted && "line-through decoration-muted-foreground/50")}>
        {lesson.title}
      </span>
      {lesson.is_preview && (
        <Badge variant="outline" className="text-xs">Preview</Badge>
      )}
    </Link>
  );
}

export default async function CourseOverviewPage({ params }: CourseOverviewPageProps) {
  const { productId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/dashboard/courses/${productId}`);
  }

  const hasAccess = await checkUserAccess(user.id, productId);

  if (!hasAccess) {
    redirect("/dashboard/courses");
  }

  const course = await getCourseByProductId(productId);

  if (!course) {
    notFound();
  }

  const progress = await getCourseProgress(user.id, course.id);
  const completedIds = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedIds.size;
  const nextLessonId = getFirstIncompleteLessonId(course.modules, progress);

  return (
    <main className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/courses"
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          My Courses
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-normal">{course.title}</h1>
          {course.description && (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {course.description}
            </p>
          )}
        </div>

        {totalLessons > 0 && (
          <div className="max-w-sm">
            <ProgressBar completed={completedCount} total={totalLessons} />
          </div>
        )}

        {nextLessonId && (
          <Link
            href={`/dashboard/courses/${productId}/lessons/${nextLessonId}`}
            className={cn(buttonVariants({ variant: "default" }), "w-fit")}
          >
            <PlayCircleIcon aria-hidden="true" data-icon="inline-start" />
            {completedCount > 0 ? "Tiếp tục học" : "Bắt đầu học"}
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {course.modules.map((mod) => {
          const modCompleted = mod.lessons.filter((l) => completedIds.has(l.id)).length;

          return (
            <div key={mod.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{mod.title}</span>
                  {mod.description && (
                    <span className="text-xs text-muted-foreground">{mod.description}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {modCompleted}/{mod.lessons.length}
                </span>
              </div>
              <div className="flex flex-col p-2">
                {mod.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    productId={productId}
                    isCompleted={completedIds.has(lesson.id)}
                    isLocked={false}
                  />
                ))}
                {mod.lessons.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Chưa có bài học nào.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
