import { createClient } from "@/lib/supabase/server";

export type ProductType =
  | "digital_download"
  | "course"
  | "tool"
  | "template"
  | "bundle"
  | "free_resource";

export type ProductStatus = "draft" | "published" | "archived";

export type ProductCategory = {
  name: string;
  slug: string;
};

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
  categories: ProductCategory[];
  description: string | null;
  product_type: ProductType;
  status: ProductStatus;
  currency: string;
  demo_url: string | null;
  preview_url: string | null;
  lemon_squeezy_product_id: string | null;
  lemon_squeezy_variant_id: string | null;
  requires_license: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AdminProductListItem = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  thumbnail_url: string | null;
  product_type: ProductType;
  status: ProductStatus;
  price_cents: number;
  currency: string;
  is_free: boolean;
  created_at: string;
  updated_at: string;
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
  requires_license,
  metadata,
  created_at,
  updated_at
`;

const adminProductListSelect = `
  id,
  title,
  slug,
  short_description,
  thumbnail_url,
  product_type,
  status,
  price_cents,
  currency,
  is_free,
  created_at,
  updated_at
`;

type ProductCategoryMapRow = {
  category: ProductCategory | ProductCategory[] | null;
};

async function getProductCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string
): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from("product_category_map")
    .select(
      `
        category:product_categories (
          name,
          slug
        )
      `
    )
    .eq("product_id", productId);

  if (error) {
    console.error("Failed to fetch product categories", error);
    return [];
  }

  return ((data ?? []) as ProductCategoryMapRow[]).flatMap((row) => {
    const category = Array.isArray(row.category)
      ? row.category[0]
      : row.category;

    return category ? [category] : [];
  });
}

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

    if (!data) {
      return null;
    }

    const product = data as Omit<ProductDetail, "categories">;

    return {
      ...product,
      categories: await getProductCategories(supabase, product.id),
    };
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

export type SearchProductsParams = {
  query?: string;
  category?: string;
  type?: ProductType;
  page?: number;
  perPage?: number;
};

export type SearchProductsResult = {
  products: PublishedProduct[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export async function getAllCategories(): Promise<ProductCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch product categories", error);
      return [];
    }

    return (data ?? []) as ProductCategory[];
  } catch (error) {
    console.error("Unexpected error while fetching categories", error);
    return [];
  }
}

export async function searchPublishedProducts(
  params: SearchProductsParams = {}
): Promise<SearchProductsResult> {
  const { query, category, type, page = 1, perPage = 12 } = params;
  const safePage = Math.max(1, page);
  const safePerPage = Math.min(50, Math.max(1, perPage));
  const offset = (safePage - 1) * safePerPage;

  const defaultResult: SearchProductsResult = {
    page: safePage,
    perPage: safePerPage,
    products: [],
    total: 0,
    totalPages: 0,
  };

  try {
    const supabase = await createClient();

    // If filtering by category, get matching product IDs first
    let categoryProductIds: string[] | null = null;

    if (category) {
      const { data: categoryMap } = await supabase
        .from("product_category_map")
        .select("product_id, product_categories!inner ( slug )")
        .eq("product_categories.slug", category);

      categoryProductIds = (categoryMap ?? []).map(
        (row: { product_id: string }) => row.product_id
      );

      if (categoryProductIds.length === 0) {
        return defaultResult;
      }
    }

    let dbQuery = supabase
      .from("products")
      .select(publishedProductSelect, { count: "exact" })
      .eq("status", "published");

    if (query && query.trim().length > 0) {
      dbQuery = dbQuery.textSearch("search_vector", query.trim(), {
        type: "websearch",
      });
    }

    if (type) {
      dbQuery = dbQuery.eq("product_type", type);
    }

    if (categoryProductIds !== null) {
      dbQuery = dbQuery.in("id", categoryProductIds);
    }

    dbQuery = dbQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + safePerPage - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error("Failed to search published products", error);
      return defaultResult;
    }

    const total = count ?? 0;

    return {
      page: safePage,
      perPage: safePerPage,
      products: (data ?? []) as PublishedProduct[],
      total,
      totalPages: Math.ceil(total / safePerPage),
    };
  } catch (error) {
    console.error("Unexpected error while searching published products", error);
    return defaultResult;
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

    if (!data) {
      return null;
    }

    const product = data as Omit<ProductDetail, "categories">;

    return {
      ...product,
      categories: await getProductCategories(supabase, product.id),
    };
  } catch (error) {
    console.error("Unexpected error while fetching admin product by id", error);
    return null;
  }
}
