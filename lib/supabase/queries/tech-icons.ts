import { createClient } from "@/lib/supabase/server";

export type TechIconOption = {
  id: string;
  label: string;
  slug: string;
  icon_url: string | null;
};

// The full tech-icon library, ordered for the product-form picker.
export async function getTechIconOptions(): Promise<TechIconOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tech_icons")
      .select("id, label, slug, icon_url")
      .order("position", { ascending: true })
      .order("label", { ascending: true });

    if (error) {
      console.error("Failed to fetch tech icon options", error);
      return [];
    }

    return (data ?? []) as TechIconOption[];
  } catch (error) {
    console.error("Unexpected error while fetching tech icon options", error);
    return [];
  }
}

// Tech-icon ids currently attached to a product, ordered by position so the
// form preserves the existing badge order.
export async function getProductTechIconIds(
  productId: string
): Promise<string[]> {
  try {
    const normalizedId = productId.trim();

    if (!normalizedId) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_tech_icons")
      .select("tech_icon_id, position")
      .eq("product_id", normalizedId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch product tech icon ids", error);
      return [];
    }

    return ((data ?? []) as { tech_icon_id: string }[]).map(
      (row) => row.tech_icon_id
    );
  } catch (error) {
    console.error("Unexpected error while fetching product tech icon ids", error);
    return [];
  }
}
