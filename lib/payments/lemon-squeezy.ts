import "server-only";

import crypto from "node:crypto";

type LemonSqueezyCustomData = Record<
  string,
  string | number | boolean | null | undefined
>;

type CheckoutSessionOptions = {
  customPriceCents?: number;
  enabledVariantIds?: number[];
  productDescription?: string;
  productMedia?: string[];
  productName?: string;
  variantQuantities?: Array<{
    quantity: number;
    variantId: number;
  }>;
};

type LemonSqueezyCheckoutResponse = {
  data?: {
    attributes?: {
      url?: string;
    };
  };
  errors?: Array<{
    detail?: string;
    title?: string;
  }>;
};

function getLemonSqueezyApiKey() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error("Missing LEMONSQUEEZY_API_KEY");
  }

  return apiKey;
}

function getLemonSqueezyWebhookSecret() {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing LEMONSQUEEZY_WEBHOOK_SECRET");
  }

  return webhookSecret;
}

function getEnabledVariantId(variantId: string) {
  const enabledVariantId = Number.parseInt(variantId, 10);

  if (!Number.isInteger(enabledVariantId) || enabledVariantId <= 0) {
    throw new Error("Invalid Lemon Squeezy variant ID");
  }

  return enabledVariantId;
}

function getCheckoutErrorMessage(response: LemonSqueezyCheckoutResponse) {
  const firstError = response.errors?.[0];

  return (
    firstError?.detail ??
    firstError?.title ??
    "Lemon Squeezy did not return a checkout URL."
  );
}

export async function createCheckoutSession(
  storeId: string,
  variantId: string,
  redirectUrl: string,
  customData: LemonSqueezyCustomData = {},
  options: CheckoutSessionOptions = {}
): Promise<string> {
  const apiKey = getLemonSqueezyApiKey();
  const enabledVariantId = getEnabledVariantId(variantId);
  const enabledVariantIds = options.enabledVariantIds ?? [enabledVariantId];

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          ...(options.customPriceCents
            ? { custom_price: options.customPriceCents }
            : {}),
          product_options: {
            redirect_url: redirectUrl,
            enabled_variants: enabledVariantIds,
            ...(options.productName ? { name: options.productName } : {}),
            ...(options.productDescription
              ? { description: options.productDescription }
              : {}),
            ...(options.productMedia ? { media: options.productMedia } : {}),
          },
          checkout_data: {
            custom: customData,
            ...(options.variantQuantities
              ? {
                  variant_quantities: options.variantQuantities.map(
                    (item) => ({
                      quantity: item.quantity,
                      variant_id: item.variantId,
                    })
                  ),
                }
              : {}),
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
    },
    method: "POST",
  });

  const responseBody = (await response.json()) as LemonSqueezyCheckoutResponse;
  const checkoutUrl = responseBody.data?.attributes?.url;

  if (!response.ok || !checkoutUrl) {
    throw new Error(getCheckoutErrorMessage(responseBody));
  }

  return checkoutUrl;
}

export function verifyWebhookSignature(payload: string, signature: string) {
  const webhookSecret = getLemonSqueezyWebhookSecret();
  const digest = Buffer.from(
    crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex"),
    "utf8"
  );
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (digest.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, signatureBuffer);
}
