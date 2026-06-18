"use client";

import { useTransition } from "react";
import { CheckCircle2Icon, CircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  markLessonComplete,
  markLessonIncomplete,
} from "@/actions/course-progress.actions";
import { Button } from "@/components/ui/button";

type LessonCompleteButtonProps = {
  lessonId: string;
  courseId: string;
  productId: string;
  isCompleted: boolean;
};

export function LessonCompleteButton({
  lessonId,
  courseId,
  productId,
  isCompleted,
}: LessonCompleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = isCompleted
        ? await markLessonIncomplete(lessonId, courseId, productId)
        : await markLessonComplete(lessonId, courseId, productId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success ?? "Progress updated.");
    });
  }

  return (
    <Button
      variant={isCompleted ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2Icon
          data-icon="inline-start"
          aria-hidden="true"
          className="animate-spin"
        />
      ) : isCompleted ? (
        <CircleIcon data-icon="inline-start" aria-hidden="true" />
      ) : (
        <CheckCircle2Icon data-icon="inline-start" aria-hidden="true" />
      )}
      {isPending
        ? "Saving..."
        : isCompleted
          ? "Mark as not done"
          : "Mark as complete"}
    </Button>
  );
}
