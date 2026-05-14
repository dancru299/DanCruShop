import { createClient } from "@/lib/supabase/server";
import type { ProductType } from "@/lib/supabase/queries/products";

export type UserPurchase = {
  id: string;
  purchased_at: string;
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
  product:
    | UserPurchase["product"]
    | UserPurchase["product"][]
    | null;
};

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

      return [
        {
          id: purchase.id,
          product,
          purchased_at: purchase.purchased_at,
        },
      ];
    });
  } catch (error) {
    console.error("Unexpected error while fetching user purchases", error);
    return [];
  }
}
