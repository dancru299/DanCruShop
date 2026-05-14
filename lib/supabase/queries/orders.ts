import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type OrderProvider = "lemon_squeezy" | "vietqr" | "vietqr_manual";
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

export type UserVietQrOrder = AdminOrder;

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

export async function getCurrentUserVietQrOrder(
  orderId: string
): Promise<UserVietQrOrder | null> {
  try {
    const normalizedOrderId = orderId.trim();

    if (!normalizedOrderId) {
      return null;
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(orderSelect)
      .eq("id", normalizedOrderId)
      .eq("provider", "vietqr")
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch VietQR order", error);
      return null;
    }

    return data as UserVietQrOrder | null;
  } catch (error) {
    console.error("Unexpected error while fetching VietQR order", error);
    return null;
  }
}
