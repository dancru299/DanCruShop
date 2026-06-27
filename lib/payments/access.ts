import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { issueLicenseKeys } from "@/lib/payments/licenses";

type GrantAccessArgs = {
  userId: string;
  // The purchasable identity is the variant id. Each maps to one product.
  variantIds: string[];
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

// The default variant id for each given product (for bundle children, which are
// unlocked at their default variant).
async function getDefaultVariantByProduct(
  supabaseAdmin: SupabaseClient,
  productIds: string[]
): Promise<Map<string, string>> {
  const ids = uniqueIds(productIds);
  const map = new Map<string, string>();

  if (ids.length === 0) {
    return map;
  }

  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .select("id, product_id")
    .in("product_id", ids)
    .eq("is_default", true);

  if (error) {
    throw new Error(`Could not load default variants: ${error.message}`);
  }

  for (const row of (data ?? []) as { id: string; product_id: string }[]) {
    map.set(row.product_id, row.id);
  }

  return map;
}

/**
 * Single source of truth for unlocking products after payment/free claim.
 * Takes the purchased variant ids, expands bundles (granting each child's
 * default variant), upserts active purchases per (product, variant), and issues
 * license keys. Idempotent.
 */
export async function grantProductAccess(
  supabaseAdmin: SupabaseClient,
  { userId, variantIds, orderId = null }: GrantAccessArgs
): Promise<string[]> {
  const ids = uniqueIds(variantIds);

  if (ids.length === 0) {
    return [];
  }

  // Resolve the purchased variants to their products.
  const { data: variantRows, error: variantError } = await supabaseAdmin
    .from("product_variants")
    .select("id, product_id")
    .in("id", ids);

  if (variantError) {
    throw new Error(`Could not load purchased variants: ${variantError.message}`);
  }

  const pairs = new Map<string, string>(); // variantId -> productId
  for (const row of (variantRows ?? []) as { id: string; product_id: string }[]) {
    pairs.set(row.id, row.product_id);
  }

  // Expand bundles: child products are unlocked at their default variant.
  const directProductIds = Array.from(new Set(pairs.values()));
  const allProductIds = await expandBundleProductIds(
    supabaseAdmin,
    directProductIds
  );
  const childProductIds = allProductIds.filter(
    (id) => !directProductIds.includes(id)
  );

  if (childProductIds.length > 0) {
    const defaults = await getDefaultVariantByProduct(
      supabaseAdmin,
      childProductIds
    );
    for (const [productId, variantId] of defaults) {
      pairs.set(variantId, productId);
    }
  }

  const rows = Array.from(pairs.entries()).map(([variantId, productId]) => ({
    access_status: "active",
    order_id: orderId,
    product_id: productId,
    user_id: userId,
    variant_id: variantId,
  }));

  const { error } = await supabaseAdmin
    .from("purchases")
    .upsert(rows, { onConflict: "user_id,product_id,variant_id" });

  if (error) {
    throw new Error(`Could not grant product access: ${error.message}`);
  }

  const grantedProductIds = Array.from(new Set(rows.map((row) => row.product_id)));
  await issueLicenseKeys(supabaseAdmin, userId, grantedProductIds, orderId);

  return grantedProductIds;
}
