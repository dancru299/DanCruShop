import { createClient } from "@/lib/supabase/server";

export type LicenseStatus = "active" | "revoked";

export type AdminLicenseKey = {
  id: string;
  license_key: string;
  status: LicenseStatus;
  created_at: string;
  product: { title: string; slug: string } | null;
  order: { email: string } | null;
};

type RawAdminLicenseRow = {
  id: string;
  license_key: string;
  status: LicenseStatus;
  created_at: string;
  product:
    | { title: string; slug: string }
    | { title: string; slug: string }[]
    | null;
  order: { email: string } | { email: string }[] | null;
};

function firstOrNull<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getAdminLicenseKeys(): Promise<AdminLicenseKey[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("license_keys")
      .select(
        `
          id,
          license_key,
          status,
          created_at,
          product:products ( title, slug ),
          order:orders ( email )
        `
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Failed to fetch admin license keys", error);
      return [];
    }

    return ((data ?? []) as RawAdminLicenseRow[]).map((row) => ({
      created_at: row.created_at,
      id: row.id,
      license_key: row.license_key,
      order: firstOrNull(row.order),
      product: firstOrNull(row.product),
      status: row.status,
    }));
  } catch (error) {
    console.error("Unexpected error while fetching admin license keys", error);
    return [];
  }
}

export async function getUserLicenseKey(
  productId: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("license_keys")
      .select("license_key")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch user license key", error);
      return null;
    }

    return data?.license_key ?? null;
  } catch (error) {
    console.error("Unexpected error while fetching user license key", error);
    return null;
  }
}
