import "server-only";

import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCustomer = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  purchase_count: number;
  total_spent_cents: number;
  primary_currency: string;
};

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const [profilesResult, ordersResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("user_id, total_cents, currency")
        .eq("status", "paid"),
    ]);

    if (profilesResult.error) {
      console.error("Failed to fetch customer profiles", profilesResult.error);
      return [];
    }

    const profiles = profilesResult.data ?? [];
    const paidOrders = ordersResult.data ?? [];

    const ordersByUser = new Map<
      string,
      { count: number; totalCents: number; currency: string }
    >();

    for (const order of paidOrders) {
      if (!order.user_id) continue;

      const existing = ordersByUser.get(order.user_id);

      if (existing) {
        existing.count += 1;
        existing.totalCents += order.total_cents;
      } else {
        ordersByUser.set(order.user_id, {
          count: 1,
          currency: order.currency ?? "USD",
          totalCents: order.total_cents,
        });
      }
    }

    return profiles.map((profile) => {
      const stats = ordersByUser.get(profile.id);

      return {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
        purchase_count: stats?.count ?? 0,
        total_spent_cents: stats?.totalCents ?? 0,
        primary_currency: stats?.currency ?? "USD",
      };
    });
  } catch (error) {
    console.error("Unexpected error while fetching admin customers", error);
    return [];
  }
}
