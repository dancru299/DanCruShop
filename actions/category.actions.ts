"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type CategoryActionResult =
  | {
      ok: true;
      categoryId: string;
    }
  | {
      ok: false;
      error: string;
    };

export type CategoryDeleteResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export type CategoryInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizeCategory(data: CategoryInput) {
  const name = data.name.trim();

  if (!name) {
    throw new Error("Category name is required.");
  }

  const slug = slugify(data.slug || name);

  if (!slug) {
    throw new Error("Category slug is required.");
  }

  return {
    description: nullableText(data.description),
    name,
    slug,
  };
}

function revalidateCategorySurfaces() {
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function createCategory(
  data: CategoryInput
): Promise<CategoryActionResult> {
  try {
    await requireAdmin();

    const payload = normalizeCategory(data);
    const supabase = await createClient();
    const { data: category, error } = await supabase
      .from("product_categories")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create category", error);
      return { error: error.message, ok: false };
    }

    revalidateCategorySurfaces();

    return { categoryId: String(category.id), ok: true };
  } catch (error) {
    console.error("Unexpected error while creating category", error);
    return { error: getErrorMessage(error), ok: false };
  }
}

export async function updateCategory(
  id: string,
  data: CategoryInput
): Promise<CategoryActionResult> {
  try {
    await requireAdmin();

    const categoryId = id.trim();

    if (!categoryId) {
      throw new Error("Category id is required.");
    }

    const payload = normalizeCategory(data);
    const supabase = await createClient();
    const { data: category, error } = await supabase
      .from("product_categories")
      .update(payload)
      .eq("id", categoryId)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to update category", error);
      return { error: error.message, ok: false };
    }

    revalidateCategorySurfaces();

    return { categoryId: String(category.id), ok: true };
  } catch (error) {
    console.error("Unexpected error while updating category", error);
    return { error: getErrorMessage(error), ok: false };
  }
}

export async function deleteCategory(
  id: string
): Promise<CategoryDeleteResult> {
  try {
    await requireAdmin();

    const categoryId = id.trim();

    if (!categoryId) {
      throw new Error("Category id is required.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      console.error("Failed to delete category", error);
      return { error: error.message, ok: false };
    }

    revalidateCategorySurfaces();

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while deleting category", error);
    return { error: getErrorMessage(error), ok: false };
  }
}
