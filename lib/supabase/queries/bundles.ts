import { createClient } from "@/lib/supabase/server";
import type {
  ProductStatus,
  ProductType,
  PublishedProduct,
} from "@/lib/supabase/queries/products";

export type BundleCandidate = {
  id: string;
  title: string;
  product_type: ProductType;
  status: ProductStatus;
};

const bundleChildSelect = `
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

export async function getBundleChildIds(bundleId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bundle_items")
      .select("child_product_id, position")
      .eq("bundle_product_id", bundleId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch bundle child ids", error);
      return [];
    }

    return ((data ?? []) as { child_product_id: string }[]).map(
      (row) => row.child_product_id
    );
  } catch (error) {
    console.error("Unexpected error while fetching bundle child ids", error);
    return [];
  }
}

export async function getBundleCandidateProducts(
  excludeId: string
): Promise<BundleCandidate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, title, product_type, status")
      .neq("id", excludeId)
      .order("title", { ascending: true });

    if (error) {
      console.error("Failed to fetch bundle candidates", error);
      return [];
    }

    return (data ?? []) as BundleCandidate[];
  } catch (error) {
    console.error("Unexpected error while fetching bundle candidates", error);
    return [];
  }
}

export async function getBundleChildProducts(
  bundleId: string
): Promise<PublishedProduct[]> {
  try {
    const supabase = await createClient();
    const { data: items, error } = await supabase
      .from("bundle_items")
      .select("child_product_id, position")
      .eq("bundle_product_id", bundleId)
      .order("position", { ascending: true });

    if (error || !items || items.length === 0) {
      return [];
    }

    const childIds = (items as { child_product_id: string }[]).map(
      (item) => item.child_product_id
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(bundleChildSelect)
      .in("id", childIds)
      .eq("status", "published");

    if (productsError) {
      console.error("Failed to fetch bundle child products", productsError);
      return [];
    }

    const byId = new Map(
      ((products ?? []) as PublishedProduct[]).map((product) => [
        product.id,
        product,
      ])
    );

    return (items as { child_product_id: string }[]).flatMap((item) => {
      const product = byId.get(item.child_product_id);

      return product ? [product] : [];
    });
  } catch (error) {
    console.error("Unexpected error while fetching bundle child products", error);
    return [];
  }
}
