import type { Coupon } from "@/lib/payments/coupons";
import { createClient } from "@/lib/supabase/server";

export type AdminCoupon = Coupon & {
  created_at: string;
  updated_at: string;
};

export async function getCouponById(id: string): Promise<AdminCoupon | null> {
  try {
    const normalizedId = id.trim();

    if (!normalizedId) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", normalizedId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch coupon by id", error);
      return null;
    }

    return (data as AdminCoupon | null) ?? null;
  } catch (error) {
    console.error("Unexpected error while fetching coupon by id", error);
    return null;
  }
}

export async function getAdminCoupons(): Promise<AdminCoupon[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin coupons", error);
      return [];
    }

    return (data ?? []) as AdminCoupon[];
  } catch (error) {
    console.error("Unexpected error while fetching admin coupons", error);
    return [];
  }
}
