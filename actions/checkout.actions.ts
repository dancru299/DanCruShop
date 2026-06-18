"use server";

import crypto from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { grantProductAccess } from "@/lib/payments/access";
import {
  recordCouponRedemption,
  validateCoupon,
  type CouponValidation,
} from "@/lib/payments/coupons";
import { createCheckoutSession } from "@/lib/payments/lemon-squeezy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CouponContext = {
  couponId: string;
  code: string;
  discountCents: number;
  currency: string;
};

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
  thumbnail_url?: string | null;
};

export type CartCheckoutState = {
  error: string | null;
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

function normalizeProductIds(productIds: string[]) {
  return Array.from(
    new Set(
      productIds
        .map((productId) => productId.trim())
        .filter((productId) => productId.length > 0)
    )
  ).slice(0, 50);
}

function parseCartProductIds(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return normalizeProductIds(
    parsed.filter((item): item is string => typeof item === "string")
  );
}

function getServerActionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Couldn't start checkout.";
}

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

async function getPublishedCheckoutProducts(productIds: string[]) {
  const normalizedProductIds = normalizeProductIds(productIds);

  if (normalizedProductIds.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
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
        thumbnail_url,
        lemon_squeezy_variant_id
      `
    )
    .in("id", normalizedProductIds)
    .eq("status", "published");

  if (error) {
    console.error("Failed to load cart products for checkout", error);
    throw new Error("Couldn't load the products in your cart.");
  }

  const products = (data ?? []) as CheckoutProduct[];

  if (products.length !== normalizedProductIds.length) {
    throw new Error("Some products in your cart are no longer available.");
  }

  const byId = new Map(products.map((product) => [product.id, product]));

  return normalizedProductIds.flatMap((productId) => {
    const product = byId.get(productId);

    return product ? [product] : [];
  });
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

async function getOptionalAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

async function unlockFreeProducts(products: CheckoutProduct[], userId: string) {
  if (products.length === 0) {
    return;
  }

  const supabaseAdmin = createAdminClient();
  await grantProductAccess(supabaseAdmin, {
    productIds: products.map((product) => product.id),
    userId,
  });
}

async function createVietQrCartOrder(
  products: CheckoutProduct[],
  user: { email?: string | null; id: string },
  coupon: CouponContext | null
) {
  if (!user.email) {
    throw new Error("Your account must have an email before checkout.");
  }

  const paidProducts = products.filter((product) => !product.is_free);
  const totalCents = paidProducts.reduce(
    (total, product) => total + product.price_cents,
    0
  );
  const discountCents = coupon ? Math.min(coupon.discountCents, totalCents) : 0;
  const finalTotalCents = Math.max(0, totalCents - discountCents);
  const currency = paidProducts[0]?.currency ?? "VND";
  const supabaseAdmin = createAdminClient();
  const providerOrderId = createVietQrOrderCode();
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      currency,
      email: user.email.trim().toLowerCase(),
      provider: "vietqr",
      provider_order_id: providerOrderId,
      raw_payload: {
        cart_product_ids: products.map((product) => product.id),
        ...(coupon
          ? {
              coupon_code: coupon.code,
              coupon_discount_cents: discountCents,
              coupon_id: coupon.couponId,
              subtotal_cents: totalCents,
            }
          : {}),
        provider_order_id: providerOrderId,
      },
      status: "pending",
      total_cents: finalTotalCents,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (orderError) {
    throw new Error(`Could not create VietQR cart order: ${orderError.message}`);
  }

  const orderId = String(order.id);
  const { error: itemError } = await supabaseAdmin.from("order_items").insert(
    paidProducts.map((product) => ({
      order_id: orderId,
      price_cents: product.price_cents,
      product_id: product.id,
      quantity: 1,
    }))
  );

  if (itemError) {
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);

    throw new Error(`Could not create VietQR cart items: ${itemError.message}`);
  }

  await unlockFreeProducts(
    products.filter((product) => product.is_free),
    user.id
  );
  await recordAnalyticsEvent({
    eventName: "vietqr_order_created",
    metadata: {
      cart_size: products.length,
      provider_order_id: providerOrderId,
      source: "cart",
    },
    orderId,
    path: "/cart",
    userId: user.id,
  });

  redirect(`/vietqr/${orderId}`);
}

async function createLemonSqueezyCartCheckout(
  products: CheckoutProduct[],
  user: { email?: string | null; id: string } | null,
  coupon: CouponContext | null
) {
  const paidProducts = products.filter((product) => !product.is_free);
  const primaryProduct = paidProducts[0];

  if (!primaryProduct?.lemon_squeezy_variant_id) {
    throw new Error("This cart is missing Lemon Squeezy checkout data.");
  }

  if (paidProducts.some((product) => !product.lemon_squeezy_variant_id)) {
    throw new Error("Some cart products are missing Lemon Squeezy variant IDs.");
  }

  const currencies = new Set(
    paidProducts.map((product) => product.currency.trim().toUpperCase())
  );

  if (currencies.size > 1) {
    throw new Error("Checkout currently supports only a single currency per cart.");
  }

  const totalCents = paidProducts.reduce(
    (total, product) => total + product.price_cents,
    0
  );
  const discountCents = coupon ? Math.min(coupon.discountCents, totalCents) : 0;
  const finalTotalCents = Math.max(0, totalCents - discountCents);
  const siteUrl = await getSiteUrl();
  const redirectUrl = `${siteUrl}/checkout/success`;
  const checkoutUrl = await createCheckoutSession(
    getLemonSqueezyStoreId(),
    primaryProduct.lemon_squeezy_variant_id,
    redirectUrl,
    {
      cart_product_ids: products.map((product) => product.id).join(","),
      cart_size: products.length,
      coupon_code: coupon?.code ?? null,
      coupon_discount_cents: coupon ? discountCents : null,
      product_id: primaryProduct.id,
      product_slug: primaryProduct.slug,
      user_email: user?.email ?? null,
      user_id: user?.id ?? null,
    },
    {
      customPriceCents:
        coupon || paidProducts.length > 1 ? finalTotalCents : undefined,
      productDescription: products
        .map((product) => `- ${product.title}`)
        .join("\n"),
      productMedia: primaryProduct.thumbnail_url
        ? [primaryProduct.thumbnail_url]
        : undefined,
      productName:
        products.length === 1
          ? primaryProduct.title
          : `DanCruShop cart (${products.length} products)`,
    }
  );

  redirect(checkoutUrl);
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
  await recordAnalyticsEvent({
    eventName: "checkout_start",
    metadata: {
      currency: checkoutProduct.currency,
      provider: "lemon_squeezy",
      slug: checkoutProduct.slug,
      source: "product_detail",
    },
    path: `/products/${checkoutProduct.slug}`,
    productId: checkoutProduct.id,
    userId: user?.id ?? null,
  });
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

export async function createCartCheckoutFromForm(
  _prevState: CartCheckoutState,
  formData: FormData
): Promise<CartCheckoutState> {
  try {
    const productIds = parseCartProductIds(formData.get("productIds"));
    const products = await getPublishedCheckoutProducts(productIds);
    const paidProducts = products.filter((product) => !product.is_free);
    const freeProducts = products.filter((product) => product.is_free);

    if (paidProducts.length === 0) {
      const user = await getRequiredAuthenticatedUser("/cart");

      await recordAnalyticsEvent({
        eventName: "checkout_start",
        metadata: {
          cart_size: products.length,
          free_count: freeProducts.length,
          paid_count: 0,
          source: "cart_free",
        },
        path: "/cart",
        userId: user.id,
      });
      await unlockFreeProducts(freeProducts, user.id);
      redirect("/dashboard");
    }

    const user = await getOptionalAuthenticatedUser();
    const paidCurrencies = new Set(
      paidProducts.map((product) => product.currency.trim().toUpperCase())
    );
    await recordAnalyticsEvent({
      eventName: "checkout_start",
      metadata: {
        cart_size: products.length,
        currencies: Array.from(paidCurrencies),
        free_count: freeProducts.length,
        paid_count: paidProducts.length,
        source: "cart",
      },
      path: "/cart",
      userId: user?.id ?? null,
    });

    const couponCode =
      typeof formData.get("coupon") === "string"
        ? String(formData.get("coupon")).trim()
        : "";
    let coupon: CouponContext | null = null;

    if (couponCode) {
      if (paidCurrencies.size !== 1) {
        return {
          error: "The discount code only applies to a single-currency cart.",
        };
      }

      const currency = Array.from(paidCurrencies)[0];
      const subtotalCents = paidProducts.reduce(
        (total, product) => total + product.price_cents,
        0
      );
      const validation: CouponValidation = await validateCoupon({
        code: couponCode,
        currency,
        email: user?.email ?? null,
        subtotalCents,
        userId: user?.id ?? null,
      });

      if (!validation.ok) {
        return { error: validation.error };
      }

      coupon = {
        code: validation.coupon.code,
        couponId: validation.coupon.id,
        currency,
        discountCents: validation.discountCents,
      };

      // 100%-off (or discount ≥ subtotal): no payment provider needed — unlock
      // everything for the buyer and record the redemption directly.
      if (validation.totalAfterCents <= 0) {
        const requiredUser =
          user ?? (await getRequiredAuthenticatedUser("/cart"));

        await unlockFreeProducts(products, requiredUser.id);
        await recordCouponRedemption({
          amountDiscountedCents: validation.discountCents,
          couponId: validation.coupon.id,
          currency,
          email: requiredUser.email ?? null,
          orderId: null,
          userId: requiredUser.id,
        });
        redirect("/dashboard");
      }
    }

    const canUseLemonSqueezy =
      paidCurrencies.size === 1 &&
      paidProducts.every((product) => product.lemon_squeezy_variant_id);
    const canUseVietQr =
      paidCurrencies.size === 1 && paidCurrencies.has("VND");

    if (canUseLemonSqueezy) {
      await createLemonSqueezyCartCheckout(products, user, coupon);
    }

    if (canUseVietQr) {
      const requiredUser = user ?? (await getRequiredAuthenticatedUser("/cart"));

      await createVietQrCartOrder(products, requiredUser, coupon);
    }

    return {
      error:
        "This cart can't be checked out yet because some paid products are missing payment configuration.",
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("Cart checkout failed", error);
    await recordAnalyticsEvent({
      eventName: "checkout_error",
      metadata: {
        message: getServerActionErrorMessage(error),
        source: "cart",
      },
      path: "/cart",
    });

    return {
      error: getServerActionErrorMessage(error),
    };
  }
}

export async function claimFreeProduct(productId: string) {
  const product = await getPublishedCheckoutProduct(productId);

  if (!product.is_free) {
    throw new Error("This product is not free.");
  }

  const user = await getRequiredAuthenticatedUser(`/products/${product.slug}`);

  try {
    const supabaseAdmin = createAdminClient();
    await grantProductAccess(supabaseAdmin, {
      productIds: [product.id],
      userId: user.id,
    });
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
    throw new Error("Free products don't need to be paid via VietQR.");
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

    await recordAnalyticsEvent({
      eventName: "vietqr_order_created",
      metadata: {
        provider_order_id: providerOrderId,
        source: "product_detail",
      },
      orderId,
      path: `/products/${product.slug}`,
      productId: product.id,
      userId: user.id,
    });
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
