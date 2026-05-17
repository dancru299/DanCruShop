import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ProductReviewReply = {
  authorName: string;
  authorRole: "admin" | "customer";
  comment: string;
  created_at: string;
  id: string;
};

export type ProductReview = {
  authorName: string;
  authorRole: "admin" | "customer";
  comment: string;
  created_at: string;
  helpful_count: number;
  id: string;
  rating: number;
  replies: ProductReviewReply[];
  title: string | null;
};

export type ProductReviewSummary = {
  averageRating: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  totalReviews: number;
};

export type ProductReviewData = {
  reviews: ProductReview[];
  summary: ProductReviewSummary;
};

type ReviewRow = {
  comment: string;
  created_at: string;
  helpful_count: number;
  id: string;
  rating: number;
  title: string | null;
  user_id: string;
};

type ReplyRow = {
  comment: string;
  created_at: string;
  id: string;
  review_id: string;
  user_id: string;
};

type ProfileRow = {
  full_name: string | null;
  id: string;
  role: "admin" | "customer";
};

type SupabaseQueryError = {
  code?: string;
  message?: string;
};

const emptyRatingCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

function getAuthorName(profile: ProfileRow | undefined, userId: string) {
  if (profile?.role === "admin") {
    return profile.full_name?.trim() || "DanCruShop";
  }

  return profile?.full_name?.trim() || `Buyer ${userId.slice(0, 6)}`;
}

function isMissingReviewsTableError(error: SupabaseQueryError | null) {
  const normalized = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();

  return (
    normalized.includes("product_review") &&
    (normalized.includes("does not exist") ||
      normalized.includes("could not find") ||
      normalized.includes("schema cache") ||
      normalized.includes("42p01") ||
      normalized.includes("pgrst205"))
  );
}

function getSummary(reviews: ReviewRow[]): ProductReviewSummary {
  const ratingCounts = { ...emptyRatingCounts };

  reviews.forEach((review) => {
    const rating = Math.max(1, Math.min(5, review.rating)) as 1 | 2 | 3 | 4 | 5;

    ratingCounts[rating] += 1;
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        totalReviews
      : 0;

  return {
    averageRating,
    ratingCounts,
    totalReviews,
  };
}

export async function getProductReviews(
  productId: string
): Promise<ProductReviewData> {
  const summary = {
    averageRating: 0,
    ratingCounts: { ...emptyRatingCounts },
    totalReviews: 0,
  };

  if (!productId) {
    return { reviews: [], summary };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data: reviewRows, error: reviewError } = await supabaseAdmin
      .from("product_reviews")
      .select(
        "id, user_id, rating, title, comment, helpful_count, created_at"
      )
      .eq("product_id", productId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (reviewError) {
      if (!isMissingReviewsTableError(reviewError)) {
        console.error("Failed to fetch product reviews", reviewError);
      }

      return { reviews: [], summary };
    }

    const reviews = (reviewRows ?? []) as ReviewRow[];

    if (reviews.length === 0) {
      return { reviews: [], summary };
    }

    const reviewIds = reviews.map((review) => review.id);
    const { data: replyRows, error: replyError } = await supabaseAdmin
      .from("product_review_replies")
      .select("id, review_id, user_id, comment, created_at")
      .in("review_id", reviewIds)
      .eq("status", "published")
      .order("created_at", { ascending: true });

    if (replyError) {
      if (!isMissingReviewsTableError(replyError)) {
        console.error("Failed to fetch product review replies", replyError);
      }
    }

    const replies = (replyRows ?? []) as ReplyRow[];
    const userIds = Array.from(
      new Set([
        ...reviews.map((review) => review.user_id),
        ...replies.map((reply) => reply.user_id),
      ])
    );
    const { data: profileRows, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role")
      .in("id", userIds);

    if (profileError) {
      console.error("Failed to fetch review profiles", profileError);
    }

    const profiles = new Map(
      ((profileRows ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ])
    );
    const repliesByReviewId = new Map<string, ProductReviewReply[]>();

    replies.forEach((reply) => {
      const profile = profiles.get(reply.user_id);
      const mappedReply: ProductReviewReply = {
        authorName: getAuthorName(profile, reply.user_id),
        authorRole: profile?.role ?? "customer",
        comment: reply.comment,
        created_at: reply.created_at,
        id: reply.id,
      };

      repliesByReviewId.set(reply.review_id, [
        ...(repliesByReviewId.get(reply.review_id) ?? []),
        mappedReply,
      ]);
    });

    return {
      reviews: reviews.map((review) => {
        const profile = profiles.get(review.user_id);

        return {
          authorName: getAuthorName(profile, review.user_id),
          authorRole: profile?.role ?? "customer",
          comment: review.comment,
          created_at: review.created_at,
          helpful_count: review.helpful_count,
          id: review.id,
          rating: review.rating,
          replies: repliesByReviewId.get(review.id) ?? [],
          title: review.title,
        };
      }),
      summary: getSummary(reviews),
    };
  } catch (error) {
    console.error("Unexpected error while fetching product reviews", error);
    return { reviews: [], summary };
  }
}
