import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PublishedProduct } from "@/lib/supabase/queries/products";
import { getProductTechSlugs } from "@/lib/products/specs";
import type { ProductMetadata } from "@/lib/products/metadata";

/**
 * Server-only query: searches published products whose metadata.specs tech
 * slugs overlap with the selected tech keys, returning results sorted by match
 * score (descending).
 */
export type StackMatchProduct = PublishedProduct & {
  matchCount: number;
  matchPercent: number;
  productTechStack: string[];
};

type SearchParams = {
  selectedTechs: string[];
  category?: string;
  type?: string;
  query?: string;
  page?: number;
  perPage?: number;
};

export async function searchByStack({
  selectedTechs,
  category,
  type,
  query,
  page = 1,
  perPage = 12,
}: SearchParams) {
  if (selectedTechs.length === 0) {
    return { products: [], total: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const selectedSet = new Set(selectedTechs.map((t) => t.toLowerCase()));

  // 1. Fetch matching product IDs if category filter is active
  let categoryProductIdsSet: Set<string> | null = null;
  if (category) {
    const categoriesList = category.split(",").map((c) => c.trim()).filter(Boolean);
    if (categoriesList.length > 0) {
      const { data: categoryMap } = await supabase
        .from("product_category_map")
        .select("product_id, product_categories!inner ( slug )")
        .in("product_categories.slug", categoriesList);

      categoryProductIdsSet = new Set(
        (categoryMap ?? []).map((row: { product_id: string }) => row.product_id)
      );

      if (categoryProductIdsSet.size === 0) {
        return { products: [], total: 0, totalPages: 0 };
      }
    }
  }

  // Fetch all published products with non-empty tech_stack metadata.
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        title,
        slug,
        short_description,
        price_cents,
        compare_at_price_cents,
        currency,
        thumbnail_url,
        product_type,
        is_free,
        metadata
      `
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to query products for stack builder", error);
    return { products: [], total: 0, totalPages: 0 };
  }

  // Score: count how many of the product's tech_stack items match selected techs
  const scored: StackMatchProduct[] = [];

  for (const row of data) {
    // Filter by category map
    if (categoryProductIdsSet && !categoryProductIdsSet.has(String(row.id))) {
      continue;
    }

    // Filter by product type
    if (type) {
      const typesList = type.split(",").map((t) => t.trim()).filter(Boolean);
      if (typesList.length > 0 && !typesList.includes(row.product_type)) {
        continue;
      }
    }

    // Filter by text search query
    if (query && query.trim()) {
      const qLower = query.toLowerCase().trim();
      const titleMatch = String(row.title).toLowerCase().includes(qLower);
      const descMatch = String(row.short_description || "").toLowerCase().includes(qLower);
      if (!titleMatch && !descMatch) {
        continue;
      }
    }

    const metadata = (row.metadata ?? {}) as ProductMetadata;
    const productTechStack = getProductTechSlugs(metadata);

    if (productTechStack.length === 0) {
      continue; // skip products with no tech specs defined
    }

    const matchCount = productTechStack.filter((tech) =>
      selectedSet.has(tech)
    ).length;

    if (matchCount === 0) {
      continue; // only show products with at least one match
    }

    const matchPercent = Math.round(
      (matchCount / selectedTechs.length) * 100
    );

    const product: PublishedProduct = {
      id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      short_description: row.short_description as string | null,
      price_cents: Number(row.price_cents),
      compare_at_price_cents: row.compare_at_price_cents != null
        ? Number(row.compare_at_price_cents)
        : null,
      currency: String(row.currency),
      thumbnail_url: row.thumbnail_url as string | null,
      product_type: String(row.product_type) as PublishedProduct["product_type"],
      is_free: Boolean(row.is_free),
    };

    scored.push({
      ...product,
      matchCount,
      matchPercent,
      productTechStack,
    });
  }

  // Sort by match percent descending, then by match count descending
  scored.sort((a, b) => {
    if (b.matchPercent !== a.matchPercent) {
      return b.matchPercent - a.matchPercent;
    }
    return b.matchCount - a.matchCount;
  });

  const total = scored.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const paged = scored.slice(start, start + perPage);

  return { products: paged, total, totalPages };
}