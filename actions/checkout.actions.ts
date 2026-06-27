"use server";

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
import { createPayPalOrder } from "@/lib/payments/paypal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CouponContext = {
  couponId: string;
  code: string;
  discountCents: number;
  currency: string;
};

// `id` is the VARIANT id (the purchasable identity); `product_id` is its parent
// product. Price/is_free/lemon id come from the variant; title/slug/currency/
// status from the product.
type CheckoutProduct = {
  id: string;
  product_id: string;
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

type CheckoutVariantRow = {
  id: string;
  price_cents: number;
  is_free: boolean;
  lemon_squeezy_variant_id: string | null;
  product:
    | {
        id: string;
        title: string;
        slug: string;
        status: string;
        product_type: string;
        currency: string;
        thumbnail_url: string | null;
      }
    | {
        id: string;
        title: string;
        slug: string;
        status: string;
        product_type: string;
        currency: string;
        thumbnail_url: string | null;
      }[]
    | null;
};

function toCheckoutProduct(row: CheckoutVariantRow): CheckoutProduct | null {
  const product = Array.isArray(row.product) ? row.product[0] : row.product;

  if (!product || product.status !== "published") {
    return null;
  }

  return {
    id: row.id,
    product_id: product.id,
    currency: product.currency,
    is_free: row.is_free,
    price_cents: row.price_cents,
    product_type: product.product_type,
    title: product.title,
    slug: product.slug,
    status: product.status,
    lemon_squeezy_variant_id: row.lemon_squeezy_variant_id,
    thumbnail_url: product.thumbnail_url,
  };
}

const checkoutVariantSelect = `
  id,
  price_cents,
  is_free,
  lemon_squeezy_variant_id,
  product:products!inner (
    id, title, slug, status, product_type, currency, thumbnail_url
  )
`;

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

async function getPublishedCheckoutProduct(variantId: string) {
  if (!variantId) {
    throw new Error("Missing variant ID");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(checkoutVariantSelect)
    .eq("id", variantId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load variant for checkout", error);
    throw new Error("Could not load product for checkout.");
  }

  const checkoutProduct = data ? toCheckoutProduct(data as CheckoutVariantRow) : null;

  if (!checkoutProduct) {
    throw new Error("Product not found.");
  }

  return checkoutProduct;
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

async function getPublishedCheckoutProducts(variantIds: string[]) {
  const normalizedVariantIds = normalizeProductIds(variantIds);

  if (normalizedVariantIds.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(checkoutVariantSelect)
    .in("id", normalizedVariantIds)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to load cart variants for checkout", error);
    throw new Error("Couldn't load the products in your cart.");
  }

  const products = ((data ?? []) as CheckoutVariantRow[]).flatMap((row) => {
    const product = toCheckoutProduct(row);
    return product ? [product] : [];
  });

  if (products.length !== normalizedVariantIds.length) {
    throw new Error("Some products in your cart are no longer available.");
  }

  const byId = new Map(products.map((product) => [product.id, product]));

  return normalizedVariantIds.flatMap((variantId) => {
    const product = byId.get(variantId);

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
    userId,
    variantIds: products.map((product) => product.id),
  });
}

// Creates a local pending PayPal order, opens a PayPal CAPTURE order and returns
// the buyer approval URL to redirect to. The local order id is sent to PayPal as
// the reference/custom id so the return page and webhook can fulfil it later.
async function preparePayPalCheckout(
  products: CheckoutProduct[],
  user: { email?: string | null; id: string },
  coupon: CouponContext | null,
  cancelPath: string,
  source: string
) {
  if (!user.email) {
    throw new Error("Your account must have an email before checkout.");
  }

  const paidProducts = products.filter((product) => !product.is_free);

  if (paidProducts.length === 0) {
    throw new Error("There's nothing to pay for with PayPal.");
  }

  const currencies = new Set(
    paidProducts.map((product) => product.currency.trim().toUpperCase())
  );

  if (currencies.size > 1) {
    throw new Error("PayPal checkout supports only a single currency per cart.");
  }

  const currency = Array.from(currencies)[0];

  if (currency === "VND") {
    throw new Error("PayPal isn't available for VND. Please use VietQR instead.");
  }

  const totalCents = paidProducts.reduce(
    (total, product) => total + product.price_cents,
    0
  );
  const discountCents = coupon ? Math.min(coupon.discountCents, totalCents) : 0;
  const finalTotalCents = Math.max(0, totalCents - discountCents);
  const supabaseAdmin = createAdminClient();
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      currency,
      email: user.email.trim().toLowerCase(),
      provider: "paypal",
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
        source,
      },
      status: "pending",
      total_cents: finalTotalCents,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (orderError) {
    console.error("Failed to create PayPal order", orderError);
    throw new Error("Couldn't start checkout. Please try again.");
  }

  const orderId = String(order.id);
  const { error: itemError } = await supabaseAdmin.from("order_items").insert(
    paidProducts.map((product) => ({
      order_id: orderId,
      price_cents: product.price_cents,
      product_id: product.product_id,
      variant_id: product.id,
      quantity: 1,
    }))
  );

  if (itemError) {
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);

    console.error("Failed to create PayPal order items", itemError);
    throw new Error("Couldn't start checkout. Please try again.");
  }

  const siteUrl = await getSiteUrl();

  let approveUrl: string;
  let paypalOrderId: string;

  try {
    const session = await createPayPalOrder({
      amountCents: finalTotalCents,
      cancelUrl: `${siteUrl}${cancelPath}`,
      currency,
      description: products.map((product) => product.title).join(", "),
      referenceId: orderId,
      returnUrl: `${siteUrl}/checkout/paypal/return`,
    });

    approveUrl = session.approveUrl;
    paypalOrderId = session.id;
  } catch (error) {
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);

    throw error;
  }

  await supabaseAdmin
    .from("orders")
    .update({ provider_order_id: paypalOrderId })
    .eq("id", orderId);

  await unlockFreeProducts(
    products.filter((product) => product.is_free),
    user.id
  );
  await recordAnalyticsEvent({
    eventName: "checkout_start",
    metadata: {
      cart_size: products.length,
      provider: "paypal",
      source,
    },
    orderId,
    path: cancelPath,
    userId: user.id,
  });

  return approveUrl;
}

export async function createPayPalCheckout(productId: string) {
  const product = await getPublishedCheckoutProduct(productId);

  if (product.is_free) {
    throw new Error("Free products don't need PayPal checkout.");
  }

  const user = await getRequiredAuthenticatedUser(`/products/${product.slug}`);
  const approveUrl = await preparePayPalCheckout(
    [product],
    user,
    null,
    `/products/${product.slug}`,
    "product_detail"
  );

  redirect(approveUrl);
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
    productId: checkoutProduct.product_id,
    userId: user?.id ?? null,
  });
  const siteUrl = await getSiteUrl();
  const redirectUrl = `${siteUrl}/checkout/success`;
  const checkoutUrl = await createCheckoutSession(
    getLemonSqueezyStoreId(),
    variantId,
    redirectUrl,
    {
      product_id: checkoutProduct.product_id,
      variant_id: checkoutProduct.id,
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

    // The buyer picks the method in the cart UI; route to it explicitly instead
    // Paid carts check out with PayPal (the only online method). A single
    // currency is required so the PayPal order has one amount/currency.
    if (paidCurrencies.size > 1) {
      return {
        error:
          "Your cart has multiple currencies. Split the order before checking out.",
      };
    }

    const requiredUser = user ?? (await getRequiredAuthenticatedUser("/cart"));
    const approveUrl = await preparePayPalCheckout(
      products,
      requiredUser,
      coupon,
      "/cart",
      "cart"
    );

    redirect(approveUrl);
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
      userId: user.id,
      variantIds: [product.id],
    });
  } catch (error) {
    console.error("Failed to claim free product", {
      error,
      productId: product.product_id,
      userId: user.id,
    });

    throw error;
  }

  redirect(`/dashboard/products/${product.product_id}`);
}
