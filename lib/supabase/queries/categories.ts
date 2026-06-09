import { createClient } from "@/lib/supabase/server";

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type AdminCategory = CategoryOption & {
  description: string | null;
  product_count: number;
};

type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_category_map: { count: number }[] | null;
};

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

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
      .select("id, name, slug, description, product_category_map(count)")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch admin categories", error);
      return [];
    }

    return ((data ?? []) as AdminCategoryRow[]).map((row) => ({
      description: row.description,
      id: row.id,
      name: row.name,
      product_count: row.product_category_map?.[0]?.count ?? 0,
      slug: row.slug,
    }));
  } catch (error) {
    console.error("Unexpected error while fetching admin categories", error);
    return [];
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
