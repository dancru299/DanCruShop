import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getOrCreateFulfillmentUser,
  normalizeFulfillmentEmail,
  sendPurchaseAccessEmail,
} from "@/lib/payments/fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";

type JsonObject = Record<string, unknown>;

type LemonSqueezyOrderPayload = {
  meta?: {
    custom_data?: unknown;
    event_name?: unknown;
    [key: string]: unknown;
  };
  data?: {
    id?: unknown;
    attributes?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ProductForOrder = {
  id: string;
  title: string;
  slug: string;
  lemon_squeezy_variant_id: string | null;
};

type ExtractedOrderData = {
  customerEmail: string;
  currency: string;
  itemPriceCents: number;
  providerOrderId: string;
  quantity: number;
  totalCents: number;
  variantId: string;
  customUserId: string | null;
};

type OrderForRefund = {
  id: string;
  status: string;
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedRecord(source: JsonObject, key: string) {
  const value = source[key];

  return isRecord(value) ? value : null;
}

function getString(source: JsonObject | null | undefined, key: string) {
  const value = source?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getNumber(source: JsonObject | null | undefined, key: string) {
  const value = source?.[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getRequiredString(value: string | null, label: string) {
  if (!value) {
    throw new Error(`Missing Lemon Squeezy order field: ${label}`);
  }

  return value;
}

function getRequiredNumber(value: number | null, label: string) {
  if (value === null) {
    throw new Error(`Missing Lemon Squeezy order field: ${label}`);
  }

  return value;
}

function normalizeCents(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid Lemon Squeezy order field: ${label}`);
  }

  return Math.round(value);
}

function normalizeQuantity(value: number | null) {
  if (value === null) {
    return 1;
  }

  const quantity = Math.round(value);

  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
}

function getCustomData(payload: LemonSqueezyOrderPayload) {
  return isRecord(payload.meta?.custom_data) ? payload.meta.custom_data : null;
}

function getPayloadParts(payload: LemonSqueezyOrderPayload) {
  const data = isRecord(payload.data) ? payload.data : null;
  const attributes = data ? getNestedRecord(data, "attributes") : null;
  const firstOrderItem = attributes
    ? getNestedRecord(attributes, "first_order_item")
    : null;
  const customData = getCustomData(payload);

  return {
    attributes,
    customData,
    data,
    firstOrderItem,
  };
}

function extractProviderOrderId(payload: LemonSqueezyOrderPayload) {
  const { attributes, data } = getPayloadParts(payload);

  return getRequiredString(
    getString(data, "id") ??
      getString(attributes, "identifier") ??
      getString(attributes, "order_id") ??
      getString(attributes, "provider_order_id"),
    "provider order id"
  );
}

function extractOrderData(payload: LemonSqueezyOrderPayload): ExtractedOrderData {
  const { attributes, customData, firstOrderItem } = getPayloadParts(payload);

  const customerEmail = getRequiredString(
    getString(attributes, "user_email") ??
      getString(attributes, "customer_email") ??
      getString(customData, "user_email") ??
      getString(customData, "email"),
    "customer email"
  );
  const totalCents = normalizeCents(
    getRequiredNumber(
      getNumber(attributes, "total") ?? getNumber(attributes, "total_cents"),
      "total cents"
    ),
    "total cents"
  );
  const itemPriceCents = normalizeCents(
    getNumber(firstOrderItem, "price") ??
      getNumber(firstOrderItem, "price_cents") ??
      getNumber(firstOrderItem, "subtotal") ??
      getNumber(firstOrderItem, "total") ??
      totalCents,
    "item price cents"
  );
  const currency = getRequiredString(
    getString(attributes, "currency")?.toUpperCase() ?? null,
    "currency"
  );
  const providerOrderId = extractProviderOrderId(payload);
  const variantId = String(
    getRequiredNumber(
      getNumber(firstOrderItem, "variant_id") ??
        getNumber(attributes, "variant_id"),
      "variant id"
    )
  );
  const customUserId = getString(customData, "user_id");

  return {
    currency,
    customUserId,
    customerEmail: normalizeFulfillmentEmail(customerEmail),
    itemPriceCents,
    providerOrderId,
    quantity: normalizeQuantity(getNumber(firstOrderItem, "quantity")),
    totalCents,
    variantId,
  };
}

async function findProductByVariantId(
  supabaseAdmin: SupabaseClient,
  variantId: string
) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, title, slug, lemon_squeezy_variant_id")
    .eq("lemon_squeezy_variant_id", variantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not map Lemon Squeezy variant to product: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No product found for Lemon Squeezy variant ${variantId}`);
  }

  return data as ProductForOrder;
}

async function upsertPaidOrder(
  supabaseAdmin: SupabaseClient,
  orderData: ExtractedOrderData,
  userId: string,
  payload: LemonSqueezyOrderPayload
) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .upsert(
      {
        currency: orderData.currency,
        email: orderData.customerEmail,
        provider: "lemon_squeezy",
        provider_order_id: orderData.providerOrderId,
        raw_payload: payload,
        status: "paid",
        total_cents: orderData.totalCents,
        user_id: userId,
      },
      {
        onConflict: "provider_order_id",
      }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not upsert order: ${error.message}`);
  }

  return data.id as string;
}

async function replaceOrderItems(
  supabaseAdmin: SupabaseClient,
  orderId: string,
  productId: string,
  orderData: ExtractedOrderData
) {
  const { error: deleteError } = await supabaseAdmin
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (deleteError) {
    throw new Error(`Could not reset order items: ${deleteError.message}`);
  }

  const { error } = await supabaseAdmin.from("order_items").insert({
    order_id: orderId,
    price_cents: orderData.itemPriceCents,
    product_id: productId,
    quantity: orderData.quantity,
  });

  if (error) {
    throw new Error(`Could not store order item: ${error.message}`);
  }
}

async function upsertPurchase(
  supabaseAdmin: SupabaseClient,
  userId: string,
  productId: string,
  orderId: string
) {
  const { error } = await supabaseAdmin.from("purchases").upsert(
    {
      access_status: "active",
      order_id: orderId,
      product_id: productId,
      user_id: userId,
    },
    {
      onConflict: "user_id,product_id",
    }
  );

  if (error) {
    throw new Error(`Could not unlock purchased product: ${error.message}`);
  }
}

async function findOrderForRefund(
  supabaseAdmin: SupabaseClient,
  providerOrderId: string
) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("provider", "lemon_squeezy")
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load refunded order: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      `Cannot refund order before it exists locally: ${providerOrderId}`
    );
  }

  return data as OrderForRefund;
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

async function markOrderRefunded(
  supabaseAdmin: SupabaseClient,
  orderId: string
) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Could not mark order refunded: ${error.message}`);
  }
}

export async function processOrderCreatedEvent(payload: unknown) {
  try {
    if (!isRecord(payload)) {
      throw new Error("Lemon Squeezy order payload must be an object.");
    }

    const orderPayload = payload as LemonSqueezyOrderPayload;
    const orderData = extractOrderData(orderPayload);
    const supabaseAdmin = createAdminClient();
    const product = await findProductByVariantId(
      supabaseAdmin,
      orderData.variantId
    );
    const user = await getOrCreateFulfillmentUser(
      supabaseAdmin,
      orderData.customerEmail,
      orderData.customUserId
    );
    const orderId = await upsertPaidOrder(
      supabaseAdmin,
      orderData,
      user.id,
      orderPayload
    );

    await replaceOrderItems(supabaseAdmin, orderId, product.id, orderData);
    await upsertPurchase(supabaseAdmin, user.id, product.id, orderId);
    await sendPurchaseAccessEmail(
      supabaseAdmin,
      orderData.customerEmail,
      product.title
    );

    return {
      orderId,
      productId: product.id,
      userId: user.id,
    };
  } catch (error) {
    console.error("Failed to process Lemon Squeezy order_created event", error);
    throw error;
  }
}

export async function processOrderRefundedEvent(payload: unknown) {
  try {
    if (!isRecord(payload)) {
      throw new Error("Lemon Squeezy refund payload must be an object.");
    }

    const orderPayload = payload as LemonSqueezyOrderPayload;
    const providerOrderId = extractProviderOrderId(orderPayload);
    const supabaseAdmin = createAdminClient();
    const order = await findOrderForRefund(supabaseAdmin, providerOrderId);
    const revokedPurchaseIds = await revokePurchasesForOrder(
      supabaseAdmin,
      order.id
    );

    if (order.status !== "refunded") {
      await markOrderRefunded(supabaseAdmin, order.id);
    }

    return {
      alreadyRefunded: order.status === "refunded",
      orderId: order.id,
      revokedPurchaseIds,
    };
  } catch (error) {
    console.error("Failed to process Lemon Squeezy order_refunded event", error);
    throw error;
  }
}
