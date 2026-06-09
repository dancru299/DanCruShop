import type { Coupon } from "@/lib/payments/coupons";
import { createClient } from "@/lib/supabase/server";

export type AdminCoupon = Coupon & {
  created_at: string;
  updated_at: string;
};

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
