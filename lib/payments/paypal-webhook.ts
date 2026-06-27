import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendRefundNotificationEmail } from "@/lib/email/send-email";
import { grantProductAccess } from "@/lib/payments/access";
import {
  normalizeFulfillmentEmail,
  sendPurchaseAccessEmail,
} from "@/lib/payments/fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";

type JsonObject = Record<string, unknown>;

type LocalOrder = {
  id: string;
  email: string;
  status: string;
  user_id: string | null;
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(source: JsonObject | null | undefined, key: string) {
  const value = source?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getResource(payload: unknown): JsonObject | null {
  if (!isRecord(payload)) {
    return null;
  }

  return isRecord(payload.resource) ? payload.resource : null;
}

// PayPal echoes our purchase_unit custom_id (the local order id) on the capture
// resource. The related PayPal order id is the fallback mapping key.
function getReferenceIds(resource: JsonObject | null) {
  const customId = getString(resource, "custom_id");
  const supplementary = isRecord(resource?.supplementary_data)
    ? (resource?.supplementary_data as JsonObject)
    : null;
  const relatedIds = isRecord(supplementary?.related_ids)
    ? (supplementary?.related_ids as JsonObject)
    : null;
  const paypalOrderId = getString(relatedIds, "order_id");

  return { customId, paypalOrderId };
}

async function findLocalOrder(
  supabaseAdmin: SupabaseClient,
  { localOrderId, paypalOrderId }: { localOrderId: string | null; paypalOrderId: string | null }
): Promise<LocalOrder | null> {
  if (localOrderId) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, email, status, user_id")
      .eq("id", localOrderId)
      .eq("provider", "paypal")
      .maybeSingle();

    if (error) {
      throw new Error(`Could not load PayPal order: ${error.message}`);
    }

    if (data) {
      return data as LocalOrder;
    }
  }

  if (paypalOrderId) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, email, status, user_id")
      .eq("provider_order_id", paypalOrderId)
      .eq("provider", "paypal")
      .maybeSingle();

    if (error) {
      throw new Error(`Could not load PayPal order: ${error.message}`);
    }

    if (data) {
      return data as LocalOrder;
    }
  }

  return null;
}

async function getOrderVariantIds(
  supabaseAdmin: SupabaseClient,
  orderId: string
) {
  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select("variant_id")
    .eq("order_id", orderId);

  if (error) {
    throw new Error(`Could not load order items: ${error.message}`);
  }

  return ((data ?? []) as { variant_id: string | null }[])
    .map((row) => row.variant_id)
    .filter((id): id is string => Boolean(id));
}

// Idempotent: marks the order paid and unlocks its products. Safe to run from
// both the buyer return page and the webhook for the same order.
async function fulfillLocalOrder(
  supabaseAdmin: SupabaseClient,
  order: LocalOrder
) {
  if (order.status === "paid") {
    return { alreadyPaid: true, orderId: order.id };
  }

  if (!order.user_id) {
    throw new Error(`PayPal order ${order.id} has no user to grant access to.`);
  }

  const variantIds = await getOrderVariantIds(supabaseAdmin, order.id);

  const grantedProductIds = await grantProductAccess(supabaseAdmin, {
    orderId: order.id,
    userId: order.user_id,
    variantIds,
  });

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id);

  if (error) {
    throw new Error(`Could not mark PayPal order paid: ${error.message}`);
  }

  if (order.email) {
    try {
      await sendPurchaseAccessEmail(
        supabaseAdmin,
        order.email,
        grantedProductIds.length === 1
          ? "your DanCruShop product"
          : `${grantedProductIds.length} DanCruShop products`
      );
    } catch (error) {
      // Email is best-effort — access is already granted.
      console.error("Failed to send PayPal purchase email", error);
    }
  }

  return { alreadyPaid: false, orderId: order.id };
}

/** Captured order has been completed by PayPal — fulfil it. */
export async function processPayPalCaptureCompleted(payload: unknown) {
  const resource = getResource(payload);
  const { customId, paypalOrderId } = getReferenceIds(resource);
  const supabaseAdmin = createAdminClient();
  const order = await findLocalOrder(supabaseAdmin, {
    localOrderId: customId,
    paypalOrderId,
  });

  if (!order) {
    throw new Error(
      `No local PayPal order found for capture (custom_id=${customId ?? "?"}, order_id=${paypalOrderId ?? "?"}).`
    );
  }

  return fulfillLocalOrder(supabaseAdmin, order);
}

/** Buyer return page path — fulfil by the PayPal order id (the return token). */
export async function fulfillPayPalOrderByPayPalId(paypalOrderId: string) {
  const supabaseAdmin = createAdminClient();
  const order = await findLocalOrder(supabaseAdmin, {
    localOrderId: null,
    paypalOrderId,
  });

  if (!order) {
    throw new Error(`No local PayPal order found for ${paypalOrderId}.`);
  }

  return fulfillLocalOrder(supabaseAdmin, order);
}

async function revokePurchasesForOrder(
  supabaseAdmin: SupabaseClient,
  orderId: string
) {
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .update({ access_status: "revoked" })
    .eq("order_id", orderId)
    .neq("access_status", "revoked")
    .select("id");

  if (error) {
    throw new Error(`Could not revoke purchases for refund: ${error.message}`);
  }

  return (data ?? []).map((purchase) => String(purchase.id));
}

/** A capture was refunded/denied — revoke access and mark the order refunded. */
export async function processPayPalCaptureRefunded(payload: unknown) {
  const resource = getResource(payload);
  const { customId, paypalOrderId } = getReferenceIds(resource);
  const supabaseAdmin = createAdminClient();
  const order = await findLocalOrder(supabaseAdmin, {
    localOrderId: customId,
    paypalOrderId,
  });

  if (!order) {
    throw new Error(
      `No local PayPal order found to refund (custom_id=${customId ?? "?"}, order_id=${paypalOrderId ?? "?"}).`
    );
  }

  const revokedPurchaseIds = await revokePurchasesForOrder(
    supabaseAdmin,
    order.id
  );

  if (order.status !== "refunded") {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", order.id);

    if (error) {
      throw new Error(`Could not mark PayPal order refunded: ${error.message}`);
    }
  }

  if (revokedPurchaseIds.length > 0 && order.email) {
    await sendRefundNotificationEmail(normalizeFulfillmentEmail(order.email));
  }

  return {
    alreadyRefunded: order.status === "refunded",
    orderId: order.id,
    revokedPurchaseIds,
  };
}
