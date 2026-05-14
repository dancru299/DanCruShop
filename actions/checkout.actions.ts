"use server";

import crypto from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createCheckoutSession } from "@/lib/payments/lemon-squeezy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CheckoutProduct = {
  id: string;
  currency: string;
  is_free: boolean;
  price_cents: number;
  product_type: string;
  title: string;
  slug: string;
  status: string;
  lemon_squeezy_variant_id: string | null;
};

function getLemonSqueezyStoreId() {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!storeId) {
    throw new Error("Missing LEMONSQUEEZY_STORE_ID");
  }

  return storeId;
}

async function getSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

function getLoginUrl(nextPath: string) {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

function createVietQrOrderCode() {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `DCS-${Date.now()}-${suffix}`;
}

async function getPublishedCheckoutProduct(productId: string) {
  if (!productId) {
    throw new Error("Missing product ID");
  }

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
        id,
        title,
        slug,
        status,
        product_type,
        price_cents,
        currency,
        is_free,
        lemon_squeezy_variant_id
      `
    )
    .eq("id", productId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to load product for checkout", error);
    throw new Error("Could not load product for checkout.");
  }

  if (!product) {
    throw new Error("Product not found.");
  }

  return product as CheckoutProduct;
}

async function getRequiredAuthenticatedUser(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(getLoginUrl(nextPath));
  }

  return user;
}

export async function createLemonSqueezyCheckout(productId: string) {
  const checkoutProduct = await getPublishedCheckoutProduct(productId);
  const variantId = checkoutProduct.lemon_squeezy_variant_id;

  if (!variantId) {
    throw new Error("This product is missing a Lemon Squeezy variant ID.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const siteUrl = await getSiteUrl();
  const redirectUrl = `${siteUrl}/checkout/success`;
  const checkoutUrl = await createCheckoutSession(
    getLemonSqueezyStoreId(),
    variantId,
    redirectUrl,
    {
      product_id: checkoutProduct.id,
      product_slug: checkoutProduct.slug,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
    }
  );

  redirect(checkoutUrl);
}

export async function claimFreeProduct(productId: string) {
  const product = await getPublishedCheckoutProduct(productId);

  if (!product.is_free) {
    throw new Error("This product is not free.");
  }

  const user = await getRequiredAuthenticatedUser(`/products/${product.slug}`);

  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("purchases").upsert(
      {
        access_status: "active",
        order_id: null,
        product_id: product.id,
        user_id: user.id,
      },
      {
        onConflict: "user_id,product_id",
      }
    );

    if (error) {
      throw new Error(`Could not claim free product: ${error.message}`);
    }
  } catch (error) {
    console.error("Failed to claim free product", {
      error,
      productId: product.id,
      userId: user.id,
    });

    throw error;
  }

  redirect(`/dashboard/products/${product.id}`);
}

export async function createVietQrOrder(productId: string) {
  const product = await getPublishedCheckoutProduct(productId);

  if (product.is_free) {
    throw new Error("Free products do not need VietQR payment.");
  }

  if (product.currency !== "VND") {
    throw new Error("VietQR checkout is only available for VND products.");
  }

  const user = await getRequiredAuthenticatedUser(`/products/${product.slug}`);

  if (!user.email) {
    throw new Error("Your account must have an email before checkout.");
  }

  let orderId: string;

  try {
    const supabaseAdmin = createAdminClient();
    const providerOrderId = createVietQrOrderCode();
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        currency: product.currency,
        email: user.email.trim().toLowerCase(),
        provider: "vietqr",
        provider_order_id: providerOrderId,
        raw_payload: {
          product_id: product.id,
          product_slug: product.slug,
          provider_order_id: providerOrderId,
        },
        status: "pending",
        total_cents: product.price_cents,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (orderError) {
      throw new Error(`Could not create VietQR order: ${orderError.message}`);
    }

    orderId = String(order.id);

    const { error: itemError } = await supabaseAdmin.from("order_items").insert({
      order_id: orderId,
      price_cents: product.price_cents,
      product_id: product.id,
      quantity: 1,
    });

    if (itemError) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);

      throw new Error(`Could not create VietQR order item: ${itemError.message}`);
    }
  } catch (error) {
    console.error("Failed to create VietQR order", {
      error,
      productId: product.id,
      userId: user.id,
    });

    throw error;
  }

  redirect(`/vietqr/${orderId}`);
}
