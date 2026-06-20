import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { grantProductAccess } from "@/lib/payments/access";
import { recordCouponRedemptionByCode } from "@/lib/payments/coupons";
import {
  getOrCreateFulfillmentUser,
  normalizeFulfillmentEmail,
  sendPurchaseAccessEmail,
} from "@/lib/payments/fulfillment";
import { sendRefundNotificationEmail } from "@/lib/email/send-email";
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
  price_cents: number;
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
  email: string;
  status: string;
};

type OrderItemInput = {
  product_id: string;
  price_cents: number;
  quantity: number;
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

function getCartProductIds(customData: JsonObject | null) {
  const rawValue = getString(customData, "cart_product_ids");

  if (!rawValue) {
    return [];
  }

  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((productId) => productId.trim())
        .filter((productId) => productId.length > 0)
    )
  ).slice(0, 50);
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
    .select("id, title, slug, lemon_squeezy_variant_id, price_cents")
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

async function findProductsByIds(
  supabaseAdmin: SupabaseClient,
  productIds: string[],
  fallbackProduct: ProductForOrder
) {
  if (productIds.length === 0) {
    return [fallbackProduct];
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, title, slug, lemon_squeezy_variant_id, price_cents")
    .in("id", productIds)
    .eq("status", "published");

  if (error) {
    throw new Error(`Could not load cart products: ${error.message}`);
  }

  const products = (data ?? []) as ProductForOrder[];
  const byId = new Map(products.map((product) => [product.id, product]));
  const orderedProducts = productIds.flatMap((productId) => {
    const product = byId.get(productId);

    return product ? [product] : [];
  });

  if (orderedProducts.length !== productIds.length) {
    throw new Error("Cart checkout referenced unavailable products.");
  }

  return orderedProducts;
}

function buildOrderItems(
  products: ProductForOrder[],
  orderData: ExtractedOrderData
): OrderItemInput[] {
  const isSingleItem = products.length === 1;

  return products.map((product) => ({
    price_cents: isSingleItem ? orderData.itemPriceCents : product.price_cents,
    product_id: product.id,
    quantity: isSingleItem ? orderData.quantity : 1,
  }));
}

// Persists the order, its items, and the buyer's purchases atomically via the
// fulfill_paid_order Postgres function (see supabase/migrations/0005_fulfill_paid_order.sql) so
// a partial failure cannot leave an order without its unlocked purchases.
async function fulfillPaidOrder(
  supabaseAdmin: SupabaseClient,
  orderData: ExtractedOrderData,
  userId: string,
  payload: LemonSqueezyOrderPayload,
  items: OrderItemInput[]
) {
  const { data, error } = await supabaseAdmin.rpc("fulfill_paid_order", {
    p_currency: orderData.currency,
    p_email: orderData.customerEmail,
    p_items: items,
    p_provider_order_id: orderData.providerOrderId,
    p_raw_payload: payload,
    p_total_cents: orderData.totalCents,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Could not fulfill paid order: ${error.message}`);
  }

  if (typeof data !== "string") {
    throw new Error("fulfill_paid_order did not return an order id.");
  }

  return data;
}

async function findOrderForRefund(
  supabaseAdmin: SupabaseClient,
  providerOrderId: string
) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, email, status")
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
    const customData = getCustomData(orderPayload);
    const products = await findProductsByIds(
      supabaseAdmin,
      getCartProductIds(customData),
      product
    );
    const user = await getOrCreateFulfillmentUser(
      supabaseAdmin,
      orderData.customerEmail,
      orderData.customUserId
    );
    const orderId = await fulfillPaidOrder(
      supabaseAdmin,
      orderData,
      user.id,
      orderPayload,
      buildOrderItems(products, orderData)
    );

    // Unlock bundle children and issue license keys for the purchased products.
    // Parent purchases were already created atomically by fulfill_paid_order.
    await grantProductAccess(supabaseAdmin, {
      orderId,
      productIds: products.map((item) => item.id),
      userId: user.id,
    });

    const couponCode = getString(customData, "coupon_code");

    if (couponCode) {
      await recordCouponRedemptionByCode({
        amountDiscountedCents: getNumber(customData, "coupon_discount_cents") ?? 0,
        code: couponCode,
        currency: orderData.currency,
        email: orderData.customerEmail,
        orderId,
        userId: user.id,
      });
    }

    await sendPurchaseAccessEmail(
      supabaseAdmin,
      orderData.customerEmail,
      products.length === 1
        ? products[0].title
        : `${products.length} DanCruShop products`
    );

    return {
      orderId,
      productId: product.id,
      productIds: products.map((item) => item.id),
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

    if (revokedPurchaseIds.length > 0 && order.email) {
      await sendRefundNotificationEmail(normalizeFulfillmentEmail(order.email));
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
