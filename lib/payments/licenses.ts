import "server-only";

import crypto from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

// Unambiguous alphabet (no 0/O/1/I) for human-readable keys.
const LICENSE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLicenseKey(): string {
  const bytes = crypto.randomBytes(16);
  let key = "";

  for (let index = 0; index < 16; index += 1) {
    if (index > 0 && index % 4 === 0) {
      key += "-";
    }

    key += LICENSE_ALPHABET[bytes[index] % LICENSE_ALPHABET.length];
  }

  return key;
}

/**
 * Issues one license key per (user, product) for any of the given products that
 * have `requires_license = true` and do not already have a key for this user.
 * Idempotent: relies on the unique (user_id, product_id) index plus a pre-check,
 * and swallows unique-violation races.
 */
export async function issueLicenseKeys(
  supabaseAdmin: SupabaseClient,
  userId: string,
  productIds: string[],
  orderId: string | null = null
): Promise<void> {
  const ids = Array.from(
    new Set(productIds.map((id) => id.trim()).filter((id) => id.length > 0))
  );

  if (ids.length === 0) {
    return;
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id")
    .in("id", ids)
    .eq("requires_license", true);

  if (error) {
    console.error("Failed to load products for license issuance", error);
    return;
  }

  const licensedIds = ((products ?? []) as { id: string }[]).map(
    (product) => product.id
  );

  if (licensedIds.length === 0) {
    return;
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("license_keys")
    .select("product_id")
    .eq("user_id", userId)
    .in("product_id", licensedIds);

  if (existingError) {
    console.error("Failed to check existing license keys", existingError);
    return;
  }

  const alreadyIssued = new Set(
    ((existing ?? []) as { product_id: string }[]).map((row) => row.product_id)
  );
  const toIssue = licensedIds.filter((id) => !alreadyIssued.has(id));

  if (toIssue.length === 0) {
    return;
  }

  const { error: insertError } = await supabaseAdmin.from("license_keys").insert(
    toIssue.map((productId) => ({
      license_key: generateLicenseKey(),
      order_id: orderId,
      product_id: productId,
      status: "active",
      user_id: userId,
    }))
  );

  if (insertError && (insertError as { code?: string }).code !== "23505") {
    console.error("Failed to issue license keys", insertError);
  }
}
