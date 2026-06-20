"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import {
  normalizeCouponCode,
  validateCoupon,
  type CouponDiscountType,
} from "@/lib/payments/coupons";
import { createClient } from "@/lib/supabase/server";

export type CouponInput = {
  code: string;
  description?: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  currency?: string | null;
  min_order_cents?: number | null;
  max_redemptions?: number | null;
  per_user_limit?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
};

export type CouponActionResult =
  | { ok: true; couponId: string }
  | { ok: false; error: string };

export type CouponDeleteResult = { ok: true } | { ok: false; error: string };

export type ApplyCouponResult =
  | {
      ok: true;
      code: string;
      currency: string;
      subtotalCents: number;
      discountCents: number;
      totalAfterCents: number;
    }
  | { ok: false; error: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function optionalInt(value: number | null | undefined) {
  if (value === null || value === undefined || value === ("" as unknown)) {
    return null;
  }

  const parsed = Math.round(Number(value));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCoupon(data: CouponInput) {
  const code = normalizeCouponCode(data.code);

  if (!code) {
    throw new Error("Mã giảm giá là bắt buộc.");
  }

  if (data.discount_type !== "percent" && data.discount_type !== "fixed") {
    throw new Error("Loại giảm giá không hợp lệ.");
  }

  const value = Math.round(Number(data.discount_value));

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Giá trị giảm phải lớn hơn 0.");
  }

  if (data.discount_type === "percent" && (value < 1 || value > 100)) {
    throw new Error("Giảm theo phần trăm phải từ 1 đến 100.");
  }

  const rawCurrency = (data.currency ?? "").trim().toUpperCase();
  const currency: string | null = rawCurrency.length === 3 ? rawCurrency : null;

  if (data.discount_type === "fixed" && !currency) {
    throw new Error("Chọn tiền tệ cho mã giảm cố định (VD: VND, USD).");
  }

  const minOrder =
    data.min_order_cents != null
      ? Math.max(0, Math.round(Number(data.min_order_cents)))
      : 0;

  return {
    code,
    currency,
    description: data.description?.trim() || null,
    discount_type: data.discount_type,
    discount_value: value,
    expires_at: data.expires_at?.trim() || null,
    is_active: data.is_active ?? true,
    max_redemptions: optionalInt(data.max_redemptions),
    min_order_cents: minOrder,
    per_user_limit: optionalInt(data.per_user_limit),
    starts_at: data.starts_at?.trim() || null,
  };
}

function revalidateCouponSurfaces() {
  revalidatePath("/admin/coupons");
}

export async function createCoupon(
  data: CouponInput
): Promise<CouponActionResult> {
  try {
    await requireAdmin();

    const payload = normalizeCoupon(data);
    const supabase = await createClient();
    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create coupon", error);
      return { error: "Không thể tạo mã giảm giá. Vui lòng thử lại.", ok: false };
    }

    revalidateCouponSurfaces();

    return { couponId: String(coupon.id), ok: true };
  } catch (error) {
    console.error("Unexpected error while creating coupon", error);
    return { error: getErrorMessage(error), ok: false };
  }
}

export async function updateCoupon(
  id: string,
  data: CouponInput
): Promise<CouponActionResult> {
  try {
    await requireAdmin();

    const couponId = id.trim();

    if (!couponId) {
      throw new Error("Coupon id is required.");
    }

    const payload = normalizeCoupon(data);
    const supabase = await createClient();
    const { data: coupon, error } = await supabase
      .from("coupons")
      .update(payload)
      .eq("id", couponId)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to update coupon", error);
      return { error: "Không thể cập nhật mã giảm giá. Vui lòng thử lại.", ok: false };
    }

    revalidateCouponSurfaces();

    return { couponId: String(coupon.id), ok: true };
  } catch (error) {
    console.error("Unexpected error while updating coupon", error);
    return { error: getErrorMessage(error), ok: false };
  }
}

export async function deleteCoupon(id: string): Promise<CouponDeleteResult> {
  try {
    await requireAdmin();

    const couponId = id.trim();

    if (!couponId) {
      throw new Error("Coupon id is required.");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("coupons").delete().eq("id", couponId);

    if (error) {
      console.error("Failed to delete coupon", error);
      return { error: "Không thể xóa mã giảm giá. Vui lòng thử lại.", ok: false };
    }

    revalidateCouponSurfaces();

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while deleting coupon", error);
    return { error: getErrorMessage(error), ok: false };
  }
}

type CartPricingProduct = {
  price_cents: number;
  currency: string;
  is_free: boolean;
};

export async function applyCouponToCart(input: {
  code: string;
  productIds: string[];
}): Promise<ApplyCouponResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ids = Array.from(
      new Set(input.productIds.map((id) => id.trim()).filter(Boolean))
    ).slice(0, 50);

    if (ids.length === 0) {
      return { error: "Your cart is empty.", ok: false };
    }

    const { data, error } = await supabase
      .from("products")
      .select("price_cents, currency, is_free")
      .in("id", ids)
      .eq("status", "published");

    if (error) {
      console.error("Failed to load cart for coupon", error);
      return { error: "Couldn't load your cart.", ok: false };
    }

    const paidProducts = ((data ?? []) as CartPricingProduct[]).filter(
      (product) => !product.is_free
    );

    if (paidProducts.length === 0) {
      return { error: "Your cart only has free products.", ok: false };
    }

    const currencies = new Set(
      paidProducts.map((product) => product.currency.trim().toUpperCase())
    );

    if (currencies.size > 1) {
      return {
        error: "The code only applies to a single-currency cart.",
        ok: false,
      };
    }

    const currency = Array.from(currencies)[0];
    const subtotalCents = paidProducts.reduce(
      (total, product) => total + product.price_cents,
      0
    );

    const validation = await validateCoupon({
      code: input.code,
      currency,
      email: user?.email ?? null,
      subtotalCents,
      userId: user?.id ?? null,
    });

    if (!validation.ok) {
      return { error: validation.error, ok: false };
    }

    return {
      code: validation.coupon.code,
      currency,
      discountCents: validation.discountCents,
      ok: true,
      subtotalCents,
      totalAfterCents: validation.totalAfterCents,
    };
  } catch (error) {
    console.error("Unexpected error while applying coupon", error);
    return { error: getErrorMessage(error), ok: false };
  }
}
