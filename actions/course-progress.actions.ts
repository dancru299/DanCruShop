"use server";

import { revalidatePath } from "next/cache";

import { checkUserAccess } from "@/lib/supabase/queries/purchases";
import { createClient } from "@/lib/supabase/server";

export type CourseProgressActionState = {
  error: string | null;
  success: string | null;
};

async function getRequiredUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function markLessonComplete(
  lessonId: string,
  courseId: string,
  productId: string
): Promise<CourseProgressActionState> {
  const user = await getRequiredUser();

  if (!user) {
    return { error: "Please log in first.", success: null };
  }

  const hasAccess = await checkUserAccess(user.id, productId);

  if (!hasAccess) {
    return { error: "You do not have access to this course.", success: null };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("course_progress").upsert(
      {
        completed: true,
        completed_at: new Date().toISOString(),
        course_id: courseId,
        lesson_id: lessonId,
        user_id: user.id,
      },
      { onConflict: "user_id,lesson_id" }
    );

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/courses/${productId}`);
    revalidatePath(`/dashboard/courses/${productId}/lessons/${lessonId}`);

    return { error: null, success: "Lesson marked as complete." };
  } catch (error) {
    console.error("Failed to mark lesson complete", error);
    return {
      error: "Could not update progress.",
      success: null,
    };
  }
}

export async function markLessonIncomplete(
  lessonId: string,
  courseId: string,
  productId: string
): Promise<CourseProgressActionState> {
  const user = await getRequiredUser();

  if (!user) {
    return { error: "Please log in first.", success: null };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("course_progress")
      .update({ completed: false, completed_at: null })
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/courses/${productId}`);
    revalidatePath(`/dashboard/courses/${productId}/lessons/${lessonId}`);

    return { error: null, success: "Lesson marked as incomplete." };
  } catch (error) {
    console.error("Failed to mark lesson incomplete", error);
    return {
      error: "Could not update progress.",
      success: null,
    };
  }
}
