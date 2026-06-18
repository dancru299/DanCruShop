import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type CouponDiscountType = "percent" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  currency: string | null;
  min_order_cents: number;
  max_redemptions: number | null;
  times_redeemed: number;
  per_user_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

export type CouponValidation =
  | {
      ok: true;
      coupon: Coupon;
      discountCents: number;
      totalAfterCents: number;
    }
  | {
      ok: false;
      error: string;
    };

type ValidateCouponArgs = {
  code: string;
  subtotalCents: number;
  currency: string;
  userId?: string | null;
  email?: string | null;
};

/**
 * Pure discount calculation — unit-tested. Never returns more than the subtotal.
 */
export function computeDiscountCents(
  coupon: Pick<Coupon, "discount_type" | "discount_value">,
  subtotalCents: number
): number {
  if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) {
    return 0;
  }

  if (coupon.discount_type === "percent") {
    const raw = Math.floor((subtotalCents * coupon.discount_value) / 100);

    return Math.min(Math.max(raw, 0), subtotalCents);
  }

  // Fixed amount (in the smallest currency unit).
  return Math.min(Math.max(coupon.discount_value, 0), subtotalCents);
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export async function validateCoupon(
  args: ValidateCouponArgs
): Promise<CouponValidation> {
  const code = normalizeCouponCode(args.code);

  if (!code) {
    return { error: "Enter a discount code.", ok: false };
  }

  if (!Number.isFinite(args.subtotalCents) || args.subtotalCents <= 0) {
    return { error: "Your cart has no paid products yet.", ok: false };
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Failed to load coupon", error);
    return { error: "Couldn't verify the discount code.", ok: false };
  }

  if (!data) {
    return { error: "That discount code doesn't exist.", ok: false };
  }

  const coupon = data as Coupon;

  if (!coupon.is_active) {
    return { error: "This discount code is disabled.", ok: false };
  }

  const now = Date.now();

  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { error: "This discount code isn't active yet.", ok: false };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { error: "This discount code has expired.", ok: false };
  }

  if (
    coupon.max_redemptions !== null &&
    coupon.times_redeemed >= coupon.max_redemptions
  ) {
    return { error: "This discount code has no uses left.", ok: false };
  }

  const normalizedCurrency = args.currency.trim().toUpperCase();

  if (
    coupon.discount_type === "fixed" &&
    coupon.currency &&
    coupon.currency.toUpperCase() !== normalizedCurrency
  ) {
    return {
      error: `This code only applies to ${coupon.currency.toUpperCase()} orders.`,
      ok: false,
    };
  }

  if (args.subtotalCents < coupon.min_order_cents) {
    return {
      error: "Your order hasn't reached the minimum value for this code.",
      ok: false,
    };
  }

  if (coupon.per_user_limit !== null && args.userId) {
    const { count, error: countError } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", args.userId);

    if (countError) {
      console.error("Failed to count coupon redemptions", countError);
      return { error: "Couldn't verify the discount code.", ok: false };
    }

    if ((count ?? 0) >= coupon.per_user_limit) {
      return { error: "You've used up your uses for this code.", ok: false };
    }
  }

  const discountCents = computeDiscountCents(coupon, args.subtotalCents);

  if (discountCents <= 0) {
    return { error: "This code can't be applied to your order.", ok: false };
  }

  return {
    coupon,
    discountCents,
    ok: true,
    totalAfterCents: args.subtotalCents - discountCents,
  };
}

type RecordRedemptionArgs = {
  couponId: string;
  orderId?: string | null;
  userId?: string | null;
  email?: string | null;
  amountDiscountedCents: number;
  currency: string;
};

/**
 * Records a redemption and bumps the coupon counter atomically. Idempotent on
 * (coupon_id, order_id) via the unique index, so re-delivered webhooks/approvals
 * never double-count.
 */
export async function recordCouponRedemption(
  args: RecordRedemptionArgs
): Promise<void> {
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("coupon_redemptions").insert({
    amount_discounted_cents: Math.max(0, Math.round(args.amountDiscountedCents)),
    coupon_id: args.couponId,
    currency: args.currency.trim().toUpperCase(),
    email: args.email ?? null,
    order_id: args.orderId ?? null,
    user_id: args.userId ?? null,
  });

  if (error) {
    // 23505 = unique violation: this order already redeemed the coupon.
    if ((error as { code?: string }).code === "23505") {
      return;
    }

    throw new Error(`Could not record coupon redemption: ${error.message}`);
  }

  const { error: incrementError } = await supabaseAdmin.rpc(
    "increment_coupon_redemption",
    { coupon_id_arg: args.couponId }
  );

  if (incrementError) {
    console.error("Failed to increment coupon redemption", incrementError);
  }
}

export async function recordCouponRedemptionByCode(
  args: Omit<RecordRedemptionArgs, "couponId"> & { code: string }
): Promise<void> {
  const code = normalizeCouponCode(args.code);

  if (!code) {
    return;
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Failed to load coupon for redemption", error);
    }

    return;
  }

  await recordCouponRedemption({ ...args, couponId: String(data.id) });
}
