"use server";

import { revalidatePath } from "next/cache";

import { checkIsAdmin } from "@/lib/auth/roles";
import { checkUserAccess } from "@/lib/supabase/queries/purchases";
import { createClient } from "@/lib/supabase/server";

export type ProductReviewActionState = {
  error: string | null;
  success: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRating(formData: FormData) {
  const rating = Number.parseInt(getString(formData, "rating"), 10);

  return Number.isInteger(rating) ? Math.max(1, Math.min(5, rating)) : 5;
}

async function getRequiredViewer() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function canParticipateInReviews(userId: string, productId: string) {
  const [hasPurchased, isAdmin] = await Promise.all([
    checkUserAccess(userId, productId),
    checkIsAdmin(),
  ]);

  return hasPurchased || isAdmin;
}

export async function createProductReview(
  _prevState: ProductReviewActionState,
  formData: FormData
): Promise<ProductReviewActionState> {
  const productId = getString(formData, "productId");
  const slug = getString(formData, "slug");
  const title = getString(formData, "title");
  const comment = getString(formData, "comment");
  const rating = getRating(formData);

  if (!productId || !slug) {
    return { error: "Thiếu dữ liệu sản phẩm.", success: null };
  }

  if (comment.length < 12) {
    return {
      error: "Hãy viết ít nhất 12 ký tự cho phần đánh giá.",
      success: null,
    };
  }

  const user = await getRequiredViewer();

  if (!user) {
    return { error: "Hãy đăng nhập trước khi gửi đánh giá.", success: null };
  }

  const hasPurchased = await checkUserAccess(user.id, productId);

  if (!hasPurchased) {
    return {
      error: "Chỉ người mua đã xác minh mới có thể đánh giá sản phẩm này.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("product_reviews").upsert(
      {
        comment,
        product_id: productId,
        rating,
        status: "pending",
        title: title || null,
        user_id: user.id,
      },
      {
        onConflict: "user_id,product_id",
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/products/${slug}`);

    return { error: null, success: "Đã đăng đánh giá." };
  } catch (error) {
    console.error("Failed to create product review", error);

    return {
      error: error instanceof Error ? error.message : "Không thể đăng đánh giá.",
      success: null,
    };
  }
}

export async function createProductReviewReply(
  _prevState: ProductReviewActionState,
  formData: FormData
): Promise<ProductReviewActionState> {
  const productId = getString(formData, "productId");
  const reviewId = getString(formData, "reviewId");
  const slug = getString(formData, "slug");
  const comment = getString(formData, "comment");

  if (!productId || !reviewId || !slug) {
    return { error: "Thiếu dữ liệu phản hồi.", success: null };
  }

  if (comment.length < 3) {
    return { error: "Phản hồi quá ngắn.", success: null };
  }

  const user = await getRequiredViewer();

  if (!user) {
    return { error: "Hãy đăng nhập trước khi phản hồi.", success: null };
  }

  if (!(await canParticipateInReviews(user.id, productId))) {
    return {
      error: "Chỉ người mua đã xác minh mới có thể phản hồi ở đây.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("product_review_replies").insert({
      comment,
      review_id: reviewId,
      status: "published",
      user_id: user.id,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/products/${slug}`);

    return { error: null, success: "Đã đăng phản hồi." };
  } catch (error) {
    console.error("Failed to create product review reply", error);

    return {
      error: error instanceof Error ? error.message : "Không thể đăng phản hồi.",
      success: null,
    };
  }
}
