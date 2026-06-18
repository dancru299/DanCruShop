import { createClient } from "@/lib/supabase/server";
import { getProductReviews } from "@/lib/supabase/queries/product-reviews";
import type { ProductType } from "@/lib/supabase/queries/products";

export type CompareProductData = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  product_type: ProductType;
  price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  is_free: boolean;
  metadata: Record<string, unknown>;
  rating: { average: number; count: number };
};

const compareSelect = `
  id,
  title,
  slug,
  thumbnail_url,
  product_type,
  price_cents,
  compare_at_price_cents,
  currency,
  is_free,
  metadata
`;

type CompareRow = Omit<CompareProductData, "rating">;

/**
 * Fetches published products by slug for the /compare page, preserving the
 * order the slugs arrived in (the URL is the source of truth). Caps at the
 * given limit so a hand-edited URL can't request an unbounded join.
 */
export async function getCompareProducts(
  slugs: string[],
  limit = 3
): Promise<CompareProductData[]> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map((slug) => slug.trim()).filter(Boolean))
  ).slice(0, limit);

  if (uniqueSlugs.length === 0) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(compareSelect)
      .in("slug", uniqueSlugs)
      .eq("status", "published");

    if (error) {
      console.error("Failed to fetch compare products", error);
      return [];
    }

    const rows = (data ?? []) as CompareRow[];
    const bySlug = new Map(rows.map((row) => [row.slug, row]));

    // Restore URL order and attach rating summaries in parallel.
    const ordered = uniqueSlugs
      .map((slug) => bySlug.get(slug))
      .filter((row): row is CompareRow => Boolean(row));

    return await Promise.all(
      ordered.map(async (row) => {
        const reviews = await getProductReviews(row.id);

        return {
          ...row,
          rating: {
            average: reviews.summary.averageRating,
            count: reviews.summary.totalReviews,
          },
        };
      })
    );
  } catch (error) {
    console.error("Unexpected error while fetching compare products", error);
    return [];
  }
}
