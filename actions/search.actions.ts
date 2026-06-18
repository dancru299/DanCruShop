"use server";

import {
  searchPublishedProducts,
  type PublishedProduct,
} from "@/lib/supabase/queries/products";
import { formatProductPrice } from "@/lib/products/display";
import type { ProductType } from "@/lib/supabase/queries/products";

export type PaletteProduct = {
  id: string;
  title: string;
  slug: string;
  priceLabel: string;
  type: ProductType;
  thumbnailUrl: string | null;
};

/**
 * Server Action: lightweight product search for the command palette.
 * Returns at most 6 results with pre-formatted price labels so the client
 * never computes pricing.
 */
export async function searchProductsForPalette(
  query: string
): Promise<PaletteProduct[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  try {
    const { products } = await searchPublishedProducts({
      query: trimmed,
      page: 1,
      perPage: 6,
    });

    return products.map((product: PublishedProduct) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      priceLabel: formatProductPrice(product),
      type: product.product_type,
      thumbnailUrl: product.thumbnail_url,
    }));
  } catch {
    // Silently fail in the palette – no toast for search errors
    return [];
  }
}

