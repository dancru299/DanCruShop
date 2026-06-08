import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminPendingReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  created_at: string;
  product_title: string | null;
  product_slug: string | null;
  author_name: string | null;
};

export async function getAdminPendingReviews(): Promise<AdminPendingReview[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("product_reviews")
    .select(
      `
        id,
        product_id,
        user_id,
        rating,
        title,
        comment,
        status,
        created_at,
        products ( title, slug ),
        profiles ( full_name )
      `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch pending reviews", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const product = Array.isArray(row.products)
      ? row.products[0]
      : row.products;
    const profile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;

    return {
      id: row.id,
      product_id: row.product_id,
      user_id: row.user_id,
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      status: row.status,
      created_at: row.created_at,
      product_title: product?.title ?? null,
      product_slug: product?.slug ?? null,
      author_name: profile?.full_name ?? null,
    };
  });
}
