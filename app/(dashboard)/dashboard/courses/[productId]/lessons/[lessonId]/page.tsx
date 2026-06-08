import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  PlayCircleIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { LessonCompleteButton } from "@/components/courses/lesson-complete-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { checkUserAccess } from "@/lib/supabase/queries/purchases";
import {
  getCourseByProductId,
  getCourseProgress,
  getLessonById,
  type CourseModule,
  type Lesson,
  type LessonProgress,
} from "@/lib/supabase/queries/courses";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{ productId: string; lessonId: string }>;
};

function getAdjacentLessons(
  modules: CourseModule[],
  currentLessonId: string
): { prev: Lesson | null; next: Lesson | null } {
  const allLessons = modules.flatMap((m) => m.lessons);
  const idx = allLessons.findIndex((l) => l.id === currentLessonId);

  return {
    prev: idx > 0 ? allLessons[idx - 1] : null,
    next: idx < allLessons.length - 1 ? allLessons[idx + 1] : null,
  };
}

function isYouTubeUrl(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeEmbedUrl(url: string) {
  const match =
    url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function VideoPlayer({ url }: { url: string }) {
  if (isYouTubeUrl(url)) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
        <iframe
          src={getYouTubeEmbedUrl(url)}
          title="Lesson video"
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
      <video
        src={url}
        controls
        className="size-full"
        title="Lesson video"
      />
    </div>
  );
}

function SidebarLesson({
  lesson,
  productId,
  isCurrent,
  isCompleted,
}: {
  lesson: Lesson;
  productId: string;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  return (
    <Link
      href={`/dashboard/courses/${productId}/lessons/${lesson.id}`}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        isCurrent
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {isCompleted ? (
        <CheckCircle2Icon aria-hidden="true" className="size-3.5 shrink-0" />
      ) : (
        <PlayCircleIcon aria-hidden="true" className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{lesson.title}</span>
    </Link>
  );
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { productId, lessonId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/dashboard/courses/${productId}/lessons/${lessonId}`);
  }

  const hasAccess = await checkUserAccess(user.id, productId);

  if (!hasAccess) {
    redirect("/dashboard/courses");
  }

  const [course, lesson] = await Promise.all([
    getCourseByProductId(productId),
    getLessonById(lessonId),
  ]);

  if (!course || !lesson) {
    notFound();
  }

  const progress = await getCourseProgress(user.id, course.id);
  const completedIds = new Set<string>(
    (progress as LessonProgress[]).filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const isCompleted = completedIds.has(lessonId);
  const { prev, next } = getAdjacentLessons(course.modules, lessonId);

  return (
    <div className="flex w-full gap-6">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 flex flex-col gap-4">
          <Link
            href={`/dashboard/courses/${productId}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
          >
            <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
            Tổng quan
          </Link>

          <div className="flex flex-col gap-3">
            {course.modules.map((mod) => (
              <div key={mod.id} className="flex flex-col gap-0.5">
                <p className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {mod.title}
                </p>
                {mod.lessons.map((l) => (
                  <SidebarLesson
                    key={l.id}
                    lesson={l}
                    productId={productId}
                    isCurrent={l.id === lessonId}
                    isCompleted={completedIds.has(l.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Mobile back link */}
        <Link
          href={`/dashboard/courses/${productId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit lg:hidden")}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Tổng quan
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {lesson.is_preview && <Badge variant="outline">Preview</Badge>}
            {isCompleted && (
              <Badge variant="default">
                <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
                Hoàn thành
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-sm leading-6 text-muted-foreground">{lesson.description}</p>
          )}
        </div>

        {lesson.video_url && <VideoPlayer url={lesson.video_url} />}

        {lesson.content && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          </div>
        )}

        {/* Navigation + complete button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex gap-2">
            {prev ? (
              <Link
                href={`/dashboard/courses/${productId}/lessons/${prev.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
                Bài trước
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/dashboard/courses/${productId}/lessons/${next.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Bài tiếp
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Link>
            )}
          </div>

          <LessonCompleteButton
            lessonId={lessonId}
            courseId={course.id}
            productId={productId}
            isCompleted={isCompleted}
          />
        </div>
      </main>
    </div>
  );
}
