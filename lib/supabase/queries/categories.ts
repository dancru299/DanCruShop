import { createClient } from "@/lib/supabase/server";

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type AdminCategory = CategoryOption & {
  description: string | null;
  icon: string | null;
  image_url: string | null;
  position: number;
  product_count: number;
};

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
};

type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  position: number | null;
  product_category_map: { count: number }[] | null;
};

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug")
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch category options", error);
      return [];
    }

    return (data ?? []) as CategoryOption[];
  } catch (error) {
    console.error("Unexpected error while fetching category options", error);
    return [];
  }
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select(
        "id, name, slug, description, icon, image_url, position, product_category_map(count)"
      )
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch admin categories", error);
      return [];
    }

    return ((data ?? []) as AdminCategoryRow[]).map((row) => ({
      description: row.description,
      icon: row.icon,
      id: row.id,
      image_url: row.image_url,
      name: row.name,
      position: row.position ?? 0,
      product_count: row.product_category_map?.[0]?.count ?? 0,
      slug: row.slug,
    }));
  } catch (error) {
    console.error("Unexpected error while fetching admin categories", error);
    return [];
  }
}

export async function getHomeCategories(): Promise<HomeCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, icon, image_url")
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch home categories", error);
      return [];
    }

    return (data ?? []) as HomeCategory[];
  } catch (error) {
    console.error("Unexpected error while fetching home categories", error);
    return [];
  }
}

export type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  position: number;
};

export async function getCategoryById(
  id: string
): Promise<CategoryDetail | null> {
  try {
    const normalizedId = id.trim();

    if (!normalizedId) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, description, icon, image_url, position")
      .eq("id", normalizedId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch category by id", error);
      return null;
    }

    return (data as CategoryDetail | null) ?? null;
  } catch (error) {
    console.error("Unexpected error while fetching category by id", error);
    return null;
  }
}

export async function getProductCategoryIds(
  productId: string
): Promise<string[]> {
  try {
    const normalizedId = productId.trim();

    if (!normalizedId) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_category_map")
      .select("category_id")
      .eq("product_id", normalizedId);

    if (error) {
      console.error("Failed to fetch product category ids", error);
      return [];
    }

    return ((data ?? []) as { category_id: string }[]).map(
      (row) => row.category_id
    );
  } catch (error) {
    console.error("Unexpected error while fetching product category ids", error);
    return [];
  }
}
