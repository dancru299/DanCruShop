"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminReviewActionState = {
  error: string | null;
  success: string | null;
};

async function updateReviewStatus(
  reviewId: string,
  status: "published" | "hidden"
): Promise<AdminReviewActionState> {
  await requireAdmin();

  if (!reviewId) {
    return { error: "Missing review ID.", success: null };
  }

  try {
    const supabase = createAdminClient();
    const { data: review, error: fetchError } = await supabase
      .from("product_reviews")
      .select("id, products ( slug )")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError || !review) {
      return { error: "Review not found.", success: null };
    }

    const { error } = await supabase
      .from("product_reviews")
      .update({ status })
      .eq("id", reviewId);

    if (error) {
      throw new Error(error.message);
    }

    const product = Array.isArray(review.products)
      ? review.products[0]
      : review.products;

    if (product?.slug) {
      revalidatePath(`/products/${product.slug}`);
    }

    revalidatePath("/admin/reviews");

    return {
      error: null,
      success: status === "published" ? "Review approved." : "Review rejected.",
    };
  } catch (error) {
    console.error("Failed to update review status", error);
    return {
      error: "Không thể cập nhật đánh giá.",
      success: null,
    };
  }
}

export async function approveReview(
  reviewId: string
): Promise<AdminReviewActionState> {
  return updateReviewStatus(reviewId, "published");
}

export async function rejectReview(
  reviewId: string
): Promise<AdminReviewActionState> {
  return updateReviewStatus(reviewId, "hidden");
}
