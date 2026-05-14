import { createClient } from "@/lib/supabase/server";

export type ProductType =
  | "digital_download"
  | "course"
  | "tool"
  | "template"
  | "bundle"
  | "free_resource";

export type ProductStatus = "draft" | "published" | "archived";

export type PublishedProduct = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  price_cents: number;
  currency: string;
  thumbnail_url: string | null;
  product_type: ProductType;
  is_free: boolean;
};

export type ProductDetail = PublishedProduct & {
  description: string | null;
  product_type: ProductType;
  status: ProductStatus;
  currency: string;
  demo_url: string | null;
  preview_url: string | null;
  lemon_squeezy_product_id: string | null;
  lemon_squeezy_variant_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AdminProductListItem = {
  id: string;
  title: string;
  slug: string;
  product_type: ProductType;
  status: ProductStatus;
  price_cents: number;
  currency: string;
  is_free: boolean;
  created_at: string;
};

const publishedProductSelect = `
  id,
  title,
  slug,
  short_description,
  price_cents,
  currency,
  thumbnail_url,
  product_type,
  is_free
`;

const productDetailSelect = `
  id,
  title,
  slug,
  short_description,
  description,
  product_type,
  status,
  price_cents,
  currency,
  is_free,
  thumbnail_url,
  demo_url,
  preview_url,
  lemon_squeezy_product_id,
  lemon_squeezy_variant_id,
  metadata,
  created_at,
  updated_at
`;

const adminProductListSelect = `
  id,
  title,
  slug,
  product_type,
  status,
  price_cents,
  currency,
  is_free,
  created_at
`;

export async function getPublishedProducts(
  limit?: number
): Promise<PublishedProduct[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select(publishedProductSelect)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (typeof limit === "number" && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch published products", error);
      return [];
    }

    return (data ?? []) as PublishedProduct[];
  } catch (error) {
    console.error("Unexpected error while fetching published products", error);
    return [];
  }
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  try {
    const normalizedSlug = slug.trim();

    if (!normalizedSlug) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(productDetailSelect)
      .eq("slug", normalizedSlug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch product by slug", error);
      return null;
    }

    return data as ProductDetail | null;
  } catch (error) {
    console.error("Unexpected error while fetching product by slug", error);
    return null;
  }
}

export async function getAdminProducts(): Promise<AdminProductListItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(adminProductListSelect)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin products", error);
      return [];
    }

    return (data ?? []) as AdminProductListItem[];
  } catch (error) {
    console.error("Unexpected error while fetching admin products", error);
    return [];
  }
}

export async function getAdminProductById(
  id: string
): Promise<ProductDetail | null> {
  try {
    const normalizedId = id.trim();

    if (!normalizedId) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(productDetailSelect)
      .eq("id", normalizedId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch admin product by id", error);
      return null;
    }

    return data as ProductDetail | null;
  } catch (error) {
    console.error("Unexpected error while fetching admin product by id", error);
    return null;
  }
}
