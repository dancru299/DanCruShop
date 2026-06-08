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
  return error instanceof Error ? error.message : "Không thể bắt đầu thanh toán.";
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
    throw new Error("Giỏ hàng của bạn đang trống.");
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
    throw new Error("Không thể tải sản phẩm trong giỏ hàng.");
  }

  const products = (data ?? []) as CheckoutProduct[];

  if (products.length !== normalizedProductIds.length) {
    throw new Error("Một số sản phẩm trong giỏ hàng không còn khả dụng.");
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
  const { error } = await supabaseAdmin.from("purchases").upsert(
    products.map((product) => ({
      access_status: "active",
      order_id: null,
      product_id: product.id,
      user_id: userId,
    })),
    {
      onConflict: "user_id,product_id",
    }
  );

  if (error) {
    throw new Error(`Could not unlock free products: ${error.message}`);
  }
}

async function createVietQrCartOrder(
  products: CheckoutProduct[],
  user: { email?: string | null; id: string }
) {
  if (!user.email) {
    throw new Error("Your account must have an email before checkout.");
  }

  const paidProducts = products.filter((product) => !product.is_free);
  const totalCents = paidProducts.reduce(
    (total, product) => total + product.price_cents,
    0
  );
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
        provider_order_id: providerOrderId,
      },
      status: "pending",
      total_cents: totalCents,
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

  redirect(`/vietqr/${orderId}`);
}

async function createLemonSqueezyCartCheckout(
  products: CheckoutProduct[],
  user: { email?: string | null; id: string } | null
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
    throw new Error("Giỏ hàng hiện chỉ hỗ trợ thanh toán với một loại tiền tệ.");
  }

  const totalCents = paidProducts.reduce(
    (total, product) => total + product.price_cents,
    0
  );
  const siteUrl = await getSiteUrl();
  const redirectUrl = `${siteUrl}/checkout/success`;
  const checkoutUrl = await createCheckoutSession(
    getLemonSqueezyStoreId(),
    primaryProduct.lemon_squeezy_variant_id,
    redirectUrl,
    {
      cart_product_ids: products.map((product) => product.id).join(","),
      cart_size: products.length,
      product_id: primaryProduct.id,
      product_slug: primaryProduct.slug,
      user_email: user?.email ?? null,
      user_id: user?.id ?? null,
    },
    {
      customPriceCents: paidProducts.length > 1 ? totalCents : undefined,
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

      await unlockFreeProducts(freeProducts, user.id);
      redirect("/dashboard");
    }

    const user = await getOptionalAuthenticatedUser();
    const paidCurrencies = new Set(
      paidProducts.map((product) => product.currency.trim().toUpperCase())
    );
    const canUseLemonSqueezy =
      paidCurrencies.size === 1 &&
      paidProducts.every((product) => product.lemon_squeezy_variant_id);
    const canUseVietQr =
      paidCurrencies.size === 1 && paidCurrencies.has("VND");

    if (canUseLemonSqueezy) {
      await createLemonSqueezyCartCheckout(products, user);
    }

    if (canUseVietQr) {
      const requiredUser = user ?? (await getRequiredAuthenticatedUser("/cart"));

      await createVietQrCartOrder(products, requiredUser);
    }

    return {
      error:
        "Giỏ hàng này chưa thể thanh toán vì một số sản phẩm trả phí còn thiếu cấu hình thanh toán.",
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("Cart checkout failed", error);

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
    throw new Error("Sản phẩm miễn phí không cần thanh toán qua VietQR.");
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
