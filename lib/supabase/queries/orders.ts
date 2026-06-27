import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

// "vietqr"/"vietqr_manual" are retained only so historical orders still render;
// no new orders use them. New paid orders are "paypal".
export type OrderProvider =
  | "paypal"
  | "lemon_squeezy"
  | "vietqr"
  | "vietqr_manual";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export type AdminOrder = {
  id: string;
  email: string;
  provider: OrderProvider;
  provider_order_id: string | null;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  created_at: string;
};

const orderSelect = `
  id,
  email,
  provider,
  provider_order_id,
  status,
  total_cents,
  currency,
  created_at
`;

export async function getAdminOrders(): Promise<AdminOrder[]> {
  try {
    await requireAdmin();

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(orderSelect)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin orders", error);
      return [];
    }

    return (data ?? []) as AdminOrder[];
  } catch (error) {
    console.error("Unexpected error while fetching admin orders", error);
    return [];
  }
}
