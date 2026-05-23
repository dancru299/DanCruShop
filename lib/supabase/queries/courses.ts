import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  position: number;
  is_preview: boolean;
};

export type CourseModule = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: Lesson[];
};

export type CourseWithModules = {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  modules: CourseModule[];
};

export type LessonProgress = {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

const lessonSelect = `
  id,
  module_id,
  title,
  slug,
  description,
  video_url,
  content,
  position,
  is_preview
`;

const moduleSelect = `
  id,
  course_id,
  title,
  description,
  position,
  lessons ( ${lessonSelect} )
`;

function sortModules(modules: CourseModule[]): CourseModule[] {
  return modules
    .map((m) => ({
      ...m,
      lessons: [...m.lessons].sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position);
}

function normalizeCourse(raw: {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  course_modules: CourseModule[] | CourseModule | null;
}): CourseWithModules {
  const rawModules = Array.isArray(raw.course_modules)
    ? raw.course_modules
    : raw.course_modules
      ? [raw.course_modules]
      : [];

  const modules: CourseModule[] = rawModules.map((m) => ({
    ...m,
    lessons: Array.isArray(m.lessons) ? m.lessons : m.lessons ? [m.lessons] : [],
  }));

  return {
    id: raw.id,
    product_id: raw.product_id,
    title: raw.title,
    description: raw.description,
    modules: sortModules(modules),
  };
}

// ---------------------------------------------------------------------------
// Public (user-scoped, respects RLS)
// ---------------------------------------------------------------------------

export async function getCourseByProductId(
  productId: string
): Promise<CourseWithModules | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select(`id, product_id, title, description, course_modules ( ${moduleSelect} )`)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch course", error);
      return null;
    }

    if (!data) return null;

    return normalizeCourse(data as Parameters<typeof normalizeCourse>[0]);
  } catch (error) {
    console.error("Unexpected error fetching course", error);
    return null;
  }
}

export async function getLessonById(
  lessonId: string
): Promise<Lesson | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lessons")
      .select(lessonSelect)
      .eq("id", lessonId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch lesson", error);
      return null;
    }

    return data as Lesson | null;
  } catch (error) {
    console.error("Unexpected error fetching lesson", error);
    return null;
  }
}

export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<LessonProgress[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_progress")
      .select("lesson_id, completed, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId);

    if (error) {
      console.error("Failed to fetch course progress", error);
      return [];
    }

    return (data ?? []) as LessonProgress[];
  } catch (error) {
    console.error("Unexpected error fetching course progress", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Admin (bypasses RLS)
// ---------------------------------------------------------------------------

export async function getAdminCourseByProductId(
  productId: string
): Promise<CourseWithModules | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .select(`id, product_id, title, description, course_modules ( ${moduleSelect} )`)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch admin course", error);
      return null;
    }

    if (!data) return null;

    return normalizeCourse(data as Parameters<typeof normalizeCourse>[0]);
  } catch (error) {
    console.error("Unexpected error fetching admin course", error);
    return null;
  }
}
