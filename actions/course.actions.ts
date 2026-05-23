"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type CourseActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SimpleActionResult =
  | { ok: true }
  | { ok: false; error: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidateCourse(productId: string) {
  revalidatePath(`/admin/products/${productId}/course`);
  revalidatePath(`/dashboard/courses/${productId}`);
}

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------

export async function createCourse(
  productId: string,
  title: string
): Promise<CourseActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .insert({ product_id: productId, title })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function updateCourse(
  courseId: string,
  productId: string,
  fields: { title?: string; description?: string | null }
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("courses")
      .update(fields)
      .eq("id", courseId);

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export async function createModule(
  courseId: string,
  productId: string,
  title: string,
  position: number
): Promise<CourseActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("course_modules")
      .insert({ course_id: courseId, title, position })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function updateModule(
  moduleId: string,
  productId: string,
  fields: { title?: string; description?: string | null; position?: number }
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("course_modules")
      .update(fields)
      .eq("id", moduleId);

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function deleteModule(
  moduleId: string,
  productId: string
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("course_modules")
      .delete()
      .eq("id", moduleId);

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export type LessonUpsert = {
  title: string;
  slug: string;
  description?: string | null;
  video_url?: string | null;
  content?: string | null;
  position: number;
  is_preview?: boolean;
};

export async function createLesson(
  moduleId: string,
  productId: string,
  fields: LessonUpsert
): Promise<CourseActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("lessons")
      .insert({ module_id: moduleId, ...fields })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function updateLesson(
  lessonId: string,
  productId: string,
  fields: Partial<LessonUpsert>
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("lessons")
      .update(fields)
      .eq("id", lessonId);

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function deleteLesson(
  lessonId: string,
  productId: string
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (error) throw new Error(error.message);

    revalidateCourse(productId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}
