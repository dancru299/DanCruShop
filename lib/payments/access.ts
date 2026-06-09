import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { issueLicenseKeys } from "@/lib/payments/licenses";

type GrantAccessArgs = {
  userId: string;
  productIds: string[];
  orderId?: string | null;
};

function uniqueIds(ids: string[]) {
  return Array.from(
    new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0))
  );
}

/**
 * Expand a set of purchased product ids to also include the child products of
 * any bundles among them (one level deep). Used so buying a bundle unlocks every
 * product it contains.
 */
export async function expandBundleProductIds(
  supabaseAdmin: SupabaseClient,
  productIds: string[]
): Promise<string[]> {
  const ids = uniqueIds(productIds);

  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("bundle_items")
    .select("child_product_id")
    .in("bundle_product_id", ids);

  if (error) {
    throw new Error(`Could not expand bundle products: ${error.message}`);
  }

  const childIds = ((data ?? []) as { child_product_id: string }[]).map(
    (row) => row.child_product_id
  );

  return uniqueIds([...ids, ...childIds]);
}

/**
 * Single source of truth for unlocking products after payment/free claim.
 * Expands bundles, upserts active purchases for every resulting product, and
 * issues license keys for products that require them. Idempotent.
 */
export async function grantProductAccess(
  supabaseAdmin: SupabaseClient,
  { userId, productIds, orderId = null }: GrantAccessArgs
): Promise<string[]> {
  const allProductIds = await expandBundleProductIds(supabaseAdmin, productIds);

  if (allProductIds.length === 0) {
    return [];
  }

  const { error } = await supabaseAdmin.from("purchases").upsert(
    allProductIds.map((productId) => ({
      access_status: "active",
      order_id: orderId,
      product_id: productId,
      user_id: userId,
    })),
    { onConflict: "user_id,product_id" }
  );

  if (error) {
    throw new Error(`Could not grant product access: ${error.message}`);
  }

  await issueLicenseKeys(supabaseAdmin, userId, allProductIds, orderId);

  return allProductIds;
}
