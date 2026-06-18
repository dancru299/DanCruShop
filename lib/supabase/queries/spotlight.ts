import { createClient } from "@/lib/supabase/server";
import type { ProductType } from "@/lib/supabase/queries/products";
import { getProductTechSlugs, techLabel, techLogo } from "@/lib/products/specs";
import type { ProductMetadata } from "@/lib/products/metadata";

// A published product enriched with its cached stats and tech-stack icons
// derived from metadata.specs. Backs the home Hero spotlight slider and the
// iMac showcase — both rank products automatically (top sellers / best rated)
// rather than via editorial curation, so the shape stays generic.
export type SpotlightProduct = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  price_cents: number;
  currency: string;
  is_free: boolean;
  product_type: ProductType;
  thumbnail_url: string | null;
  rating_average: number;
  rating_count: number;
  sales_count: number;
  created_at: string;
  tech_icons: SpotlightTechIcon[];
};

export type SpotlightTechIcon = {
  label: string;
  icon_url: string | null;
};

const spotlightSelect = `
  id,
  title,
  slug,
  short_description,
  price_cents,
  currency,
  is_free,
  product_type,
  thumbnail_url,
  rating_average,
  rating_count,
  sales_count,
  created_at,
  metadata
`;

type SpotlightRow = Omit<SpotlightProduct, "tech_icons"> & {
  metadata: ProductMetadata | null;
};

function mapSpotlightRow(row: SpotlightRow): SpotlightProduct {
  const metadata = row.metadata ?? {};
  const slugs = getProductTechSlugs(metadata);
  const tech_icons: SpotlightTechIcon[] = slugs.map((slug) => ({
    label: techLabel(slug, "en"),
    icon_url: techLogo(slug),
  }));

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    short_description: row.short_description,
    price_cents: row.price_cents,
    currency: row.currency,
    is_free: row.is_free,
    product_type: row.product_type,
    thumbnail_url: row.thumbnail_url,
    rating_average: Number(row.rating_average) || 0,
    rating_count: Number(row.rating_count) || 0,
    sales_count: Number(row.sales_count) || 0,
    created_at: row.created_at,
    tech_icons,
  };
}

// Published products ranked for the home spotlight surfaces: best sellers
// first, then best rated, then newest. Shared by the Hero slider (limit 5)
// and the iMac showcase (limit 3).
async function getSpotlightProducts(
  limit: number
): Promise<SpotlightProduct[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(spotlightSelect)
      .eq("status", "published")
      .order("sales_count", { ascending: false })
      .order("rating_average", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch spotlight products", error);
      return [];
    }

    return ((data ?? []) as SpotlightRow[]).map(mapSpotlightRow);
  } catch (error) {
    console.error("Unexpected error while fetching spotlight products", error);
    return [];
  }
}

export function getHeroSpotlightProducts(
  limit = 5
): Promise<SpotlightProduct[]> {
  return getSpotlightProducts(limit);
}

export function getShowcaseSpotlightProducts(
  limit = 3
): Promise<SpotlightProduct[]> {
  return getSpotlightProducts(limit);
}