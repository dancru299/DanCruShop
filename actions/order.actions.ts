"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { grantProductAccess } from "@/lib/payments/access";
import { recordCouponRedemption } from "@/lib/payments/coupons";
import {
  getOrCreateFulfillmentUser,
  normalizeFulfillmentEmail,
  sendPurchaseAccessEmail,
} from "@/lib/payments/fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderActionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

type VietQrOrderForApproval = {
  id: string;
  email: string;
  provider: string;
  status: string;
  currency: string;
  raw_payload: Record<string, unknown> | null;
};

type ProductForApproval = {
  id: string;
  title: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function loadVietQrOrder(orderId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, email, provider, status, currency, raw_payload")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load VietQR order", error);
    throw new Error("Không thể tải đơn hàng. Vui lòng thử lại.");
  }

  if (!data) {
    throw new Error("Order was not found.");
  }

  return data as VietQrOrderForApproval;
}

async function loadOrderProductIds(orderId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select("product_id")
    .eq("order_id", orderId);

  if (error) {
    console.error("Failed to load order items", error);
    throw new Error("Không thể tải sản phẩm trong đơn. Vui lòng thử lại.");
  }

  const productIds = Array.from(
    new Set(
      ((data ?? []) as { product_id: string }[]).map((item) => item.product_id)
    )
  );

  if (productIds.length === 0) {
    throw new Error("Order does not have any product item.");
  }

  return productIds;
}

async function loadProducts(productIds: string[]) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, title")
    .in("id", productIds);

  if (error) {
    console.error("Failed to load order products", error);
    throw new Error("Không thể tải sản phẩm. Vui lòng thử lại.");
  }

  if (!data || data.length === 0) {
    throw new Error("Products were not found.");
  }

  return data as ProductForApproval[];
}

export async function approveVietQrOrder(
  orderId: string
): Promise<OrderActionResult> {
  try {
    await requireAdmin();

    const normalizedOrderId = orderId.trim();

    if (!normalizedOrderId) {
      throw new Error("Order id is required.");
    }

    const supabaseAdmin = createAdminClient();
    const order = await loadVietQrOrder(normalizedOrderId);

    if (order.provider !== "vietqr") {
      throw new Error("Only VietQR orders can be manually approved.");
    }

    if (order.status === "paid") {
      return {
        message: "Order was already approved.",
        ok: true,
      };
    }

    if (order.status !== "pending") {
      throw new Error("Only pending VietQR orders can be approved.");
    }

    const productIds = await loadOrderProductIds(order.id);
    const products = await loadProducts(productIds);
    const normalizedEmail = normalizeFulfillmentEmail(order.email);
    const user = await getOrCreateFulfillmentUser(
      supabaseAdmin,
      normalizedEmail
    );

    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        user_id: user.id,
      })
      .eq("id", order.id)
      .eq("status", "pending")
      .select("id")
      .single();

    if (orderError) {
      console.error("Failed to approve VietQR order", orderError);
      throw new Error("Không thể duyệt đơn hàng. Vui lòng thử lại.");
    }

    await grantProductAccess(supabaseAdmin, {
      orderId: order.id,
      productIds,
      userId: user.id,
    });

    const rawPayload = order.raw_payload ?? {};
    const couponId =
      typeof rawPayload.coupon_id === "string" ? rawPayload.coupon_id : null;

    if (couponId) {
      await recordCouponRedemption({
        amountDiscountedCents:
          typeof rawPayload.coupon_discount_cents === "number"
            ? rawPayload.coupon_discount_cents
            : 0,
        couponId,
        currency: order.currency,
        email: normalizedEmail,
        orderId: order.id,
        userId: user.id,
      });
    }

    const emailProductName =
      products.length === 1
        ? products[0].title
        : `${products.length} DanCruShop products`;

    await sendPurchaseAccessEmail(supabaseAdmin, normalizedEmail, emailProductName);

    revalidatePath("/admin/orders");
    revalidatePath("/dashboard");

    return {
      message: "Order approved and access email sent.",
      ok: true,
    };
  } catch (error) {
    console.error("Failed to approve VietQR order", {
      error,
      orderId,
    });

    return {
      error: getErrorMessage(error),
      ok: false,
    };
  }
}
