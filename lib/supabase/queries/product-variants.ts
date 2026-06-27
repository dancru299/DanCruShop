import { createClient } from "@/lib/supabase/server";

// A purchasable version of a product: its own name, price and files, but the
// product owns all shared content (title, slug, description, images, currency,
// status). Replaces the old "option = a separate product row" model.
export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  is_free: boolean;
  position: number;
  is_default: boolean;
  is_active: boolean;
  lemon_squeezy_variant_id: string | null;
  requires_license: boolean;
};

const variantSelect = `
  id,
  product_id,
  name,
  price_cents,
  compare_at_price_cents,
  is_free,
  position,
  is_default,
  is_active,
  lemon_squeezy_variant_id,
  requires_license
`;

// Every variant of a product (any state), for the admin variant editor.
export async function getProductVariants(
  productId: string
): Promise<ProductVariant[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_variants")
      .select(variantSelect)
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch product variants", error);
      return [];
    }

    return (data ?? []) as ProductVariant[];
  } catch (error) {
    console.error("Unexpected error while fetching product variants", error);
    return [];
  }
}

// Active variants of a product, ordered for display. Used by the storefront
// variant selector. RLS already limits this to published products.
export async function getPublishedVariants(
  productId: string
): Promise<ProductVariant[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_variants")
      .select(variantSelect)
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch published variants", error);
      return [];
    }

    return (data ?? []) as ProductVariant[];
  } catch (error) {
    console.error("Unexpected error while fetching published variants", error);
    return [];
  }
}

export function pickDefaultVariant(
  variants: ProductVariant[]
): ProductVariant | null {
  return (
    variants.find((variant) => variant.is_default) ?? variants[0] ?? null
  );
}
