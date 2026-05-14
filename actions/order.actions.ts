"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
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
};

type OrderItemForApproval = {
  product_id: string;
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
    .select("id, email, provider, status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load order: ${error.message}`);
  }

  if (!data) {
    throw new Error("Order was not found.");
  }

  return data as VietQrOrderForApproval;
}

async function loadOrderItem(orderId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select("product_id")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load order item: ${error.message}`);
  }

  if (!data) {
    throw new Error("Order does not have any product item.");
  }

  return data as OrderItemForApproval;
}

async function loadProduct(productId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, title")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load product: ${error.message}`);
  }

  if (!data) {
    throw new Error("Product was not found.");
  }

  return data as ProductForApproval;
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

    const orderItem = await loadOrderItem(order.id);
    const product = await loadProduct(orderItem.product_id);
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
      throw new Error(`Could not approve order: ${orderError.message}`);
    }

    const { error: purchaseError } = await supabaseAdmin.from("purchases").upsert(
      {
        access_status: "active",
        order_id: order.id,
        product_id: product.id,
        user_id: user.id,
      },
      {
        onConflict: "user_id,product_id",
      }
    );

    if (purchaseError) {
      throw new Error(`Could not unlock product: ${purchaseError.message}`);
    }

    await sendPurchaseAccessEmail(supabaseAdmin, normalizedEmail, product.title);

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
