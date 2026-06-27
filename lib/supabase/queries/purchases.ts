import { createClient } from "@/lib/supabase/server";
import type { ProductType } from "@/lib/supabase/queries/products";

export type UserPurchase = {
  id: string;
  purchased_at: string;
  variant: {
    id: string;
    name: string;
  } | null;
  product: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    product_type: ProductType;
    is_free: boolean;
  };
};

type PurchaseRow = {
  id: string;
  purchased_at: string;
  variant_id: string | null;
  variant:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
  product:
    | UserPurchase["product"]
    | UserPurchase["product"][]
    | null;
};

// True when the user owns ANY active variant of the product (used to gate
// reviews / "purchased" affordances at the product level).
export async function checkUserAccess(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    if (!userId || !productId) {
      return false;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("access_status", "active")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to check user product access", error);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.error("Unexpected error while checking user product access", error);
    return false;
  }
}

// The variant ids of a product the user actively owns — lets the storefront mark
// exactly which option is already purchased.
export async function getPurchasedVariantIds(
  userId: string,
  productId: string
): Promise<string[]> {
  try {
    if (!userId || !productId) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("purchases")
      .select("variant_id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("access_status", "active");

    if (error) {
      console.error("Failed to load purchased variants", error);
      return [];
    }

    return ((data ?? []) as { variant_id: string | null }[])
      .map((row) => row.variant_id)
      .filter((id): id is string => Boolean(id));
  } catch (error) {
    console.error("Unexpected error while loading purchased variants", error);
    return [];
  }
}

export async function getUserPurchases(
  userId: string
): Promise<UserPurchase[]> {
  try {
    if (!userId) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("purchases")
      .select(
        `
          id,
          purchased_at,
          variant_id,
          variant:product_variants ( id, name ),
          product:products (
            id,
            title,
            slug,
            thumbnail_url,
            product_type,
            is_free
          )
        `
      )
      .eq("user_id", userId)
      .eq("access_status", "active")
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch user purchases", error);
      return [];
    }

    return ((data ?? []) as PurchaseRow[]).flatMap((purchase) => {
      const product = Array.isArray(purchase.product)
        ? purchase.product[0]
        : purchase.product;

      if (!product) {
        return [];
      }

      const variant = Array.isArray(purchase.variant)
        ? purchase.variant[0]
        : purchase.variant;

      return [
        {
          id: purchase.id,
          product,
          variant: variant ?? null,
          purchased_at: purchase.purchased_at,
        },
      ];
    });
  } catch (error) {
    console.error("Unexpected error while fetching user purchases", error);
    return [];
  }
}
