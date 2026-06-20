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
  icon?: string | null;
  imageUrl?: string | null;
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
    icon: nullableText(data.icon),
    image_url: nullableText(data.imageUrl),
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

    // Append new categories to the end of the current ordering.
    const { data: last } = await supabase
      .from("product_categories")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = ((last?.position as number | null) ?? -1) + 1;

    const { data: category, error } = await supabase
      .from("product_categories")
      .insert({ ...payload, position: nextPosition })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create category", error);
      return { error: "Không thể tạo danh mục. Vui lòng thử lại.", ok: false };
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
      return { error: "Không thể cập nhật danh mục. Vui lòng thử lại.", ok: false };
    }

    revalidateCategorySurfaces();

    return { categoryId: String(category.id), ok: true };
  } catch (error) {
    console.error("Unexpected error while updating category", error);
    return { error: getErrorMessage(error), ok: false };
  }
}

export async function moveCategory(
  id: string,
  direction: "up" | "down"
): Promise<CategoryDeleteResult> {
  try {
    await requireAdmin();

    const categoryId = id.trim();

    if (!categoryId) {
      throw new Error("Category id is required.");
    }

    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("product_categories")
      .select("id, position")
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to load categories for reorder", error);
      return { error: "Không thể tải danh mục. Vui lòng thử lại.", ok: false };
    }

    const ordered = (rows ?? []) as { id: string; position: number }[];
    const index = ordered.findIndex((row) => row.id === categoryId);

    if (index === -1) {
      return { error: "Không tìm thấy category.", ok: false };
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= ordered.length) {
      // Already at the edge — nothing to do.
      return { ok: true };
    }

    const current = ordered[index];
    const neighbor = ordered[swapIndex];

    // Swap the two positions with separate updates (position has no unique
    // constraint, so a brief duplicate during the swap is fine).
    const [first, second] = await Promise.all([
      supabase
        .from("product_categories")
        .update({ position: neighbor.position })
        .eq("id", current.id),
      supabase
        .from("product_categories")
        .update({ position: current.position })
        .eq("id", neighbor.id),
    ]);

    if (first.error || second.error) {
      console.error("Failed to reorder categories", first.error ?? second.error);
      return {
        error: "Không thể sắp xếp lại danh mục. Vui lòng thử lại.",
        ok: false,
      };
    }

    revalidateCategorySurfaces();

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while reordering categories", error);
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
      return { error: "Không thể xóa danh mục. Vui lòng thử lại.", ok: false };
    }

    revalidateCategorySurfaces();

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while deleting category", error);
    return { error: getErrorMessage(error), ok: false };
  }
}
