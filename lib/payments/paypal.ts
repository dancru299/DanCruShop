import "server-only";

// Minimal PayPal Orders v2 REST client. Mirrors the shape of
// lib/payments/lemon-squeezy.ts: small functions that throw clearly when the
// required env is missing, and a server-side redirect (approve link) flow so we
// don't need to ship the PayPal JS SDK to the browser.

type CreatePayPalOrderArgs = {
  amountCents: number;
  cancelUrl: string;
  currency: string;
  description?: string;
  referenceId: string;
  returnUrl: string;
};

type PayPalLink = {
  href?: string;
  rel?: string;
  method?: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  details?: Array<{ description?: string; issue?: string }>;
  message?: string;
};

// PayPal expects amounts as a decimal string. These currencies have no minor
// unit, so the integer amount is sent as-is; all others are divided by 100.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "HUF",
  "JPY",
  "TWD",
]);

function getPayPalBaseUrl() {
  const env = process.env.PAYPAL_ENV?.trim().toLowerCase();

  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function getPayPalClientId() {
  const clientId = process.env.PAYPAL_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing PAYPAL_CLIENT_ID");
  }

  return clientId;
}

function getPayPalClientSecret() {
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error("Missing PAYPAL_CLIENT_SECRET");
  }

  return clientSecret;
}

function getPayPalWebhookId() {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    throw new Error("Missing PAYPAL_WEBHOOK_ID");
  }

  return webhookId;
}

function formatPayPalAmount(amountCents: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return String(Math.round(amountCents));
  }

  return (amountCents / 100).toFixed(2);
}

function getPayPalErrorMessage(response: PayPalOrderResponse) {
  return (
    response.details?.[0]?.description ??
    response.details?.[0]?.issue ??
    response.message ??
    "PayPal did not return a valid response."
  );
}

async function getAccessToken() {
  const credentials = Buffer.from(
    `${getPayPalClientId()}:${getPayPalClientSecret()}`
  ).toString("base64");

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  const body = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? "Could not authenticate with PayPal."
    );
  }

  return body.access_token;
}

/**
 * Creates a PayPal CAPTURE order and returns its id plus the buyer approval URL
 * to redirect to. `referenceId` ties the PayPal order back to our local order.
 */
export async function createPayPalOrder({
  amountCents,
  cancelUrl,
  currency,
  description,
  referenceId,
  returnUrl,
}: CreatePayPalOrderArgs): Promise<{ approveUrl: string; id: string }> {
  const accessToken = await getAccessToken();
  const normalizedCurrency = currency.trim().toUpperCase();

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: normalizedCurrency,
            value: formatPayPalAmount(amountCents, normalizedCurrency),
          },
          custom_id: referenceId,
          reference_id: referenceId,
          ...(description ? { description: description.slice(0, 127) } : {}),
        },
      ],
      application_context: {
        cancel_url: cancelUrl,
        return_url: returnUrl,
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const body = (await response.json()) as PayPalOrderResponse;
  const approveUrl = body.links?.find((link) => link.rel === "approve")?.href;

  if (!response.ok || !body.id || !approveUrl) {
    throw new Error(getPayPalErrorMessage(body));
  }

  return { approveUrl, id: body.id };
}

/**
 * Captures an approved PayPal order. Returns the capture status; PayPal returns
 * "COMPLETED" on success. Safe to call more than once — PayPal returns the
 * existing capture for an already-captured order.
 */
export async function capturePayPalOrder(
  orderId: string
): Promise<{ status: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  const body = (await response.json()) as PayPalOrderResponse;

  // 422 with ORDER_ALREADY_CAPTURED means the webhook already finished the job.
  const alreadyCaptured = body.details?.some(
    (detail) => detail.issue === "ORDER_ALREADY_CAPTURED"
  );

  if (!response.ok && !alreadyCaptured) {
    throw new Error(getPayPalErrorMessage(body));
  }

  return { status: alreadyCaptured ? "COMPLETED" : body.status ?? "UNKNOWN" };
}

type PayPalWebhookHeaders = {
  authAlgo: string | null;
  certUrl: string | null;
  transmissionId: string | null;
  transmissionSig: string | null;
  transmissionTime: string | null;
};

/**
 * Verifies a webhook payload's authenticity by asking PayPal to validate the
 * transmission signature against our configured webhook id.
 */
export async function verifyPayPalWebhook(
  headers: PayPalWebhookHeaders,
  rawBody: string
): Promise<boolean> {
  if (
    !headers.authAlgo ||
    !headers.certUrl ||
    !headers.transmissionId ||
    !headers.transmissionSig ||
    !headers.transmissionTime
  ) {
    return false;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      body: JSON.stringify({
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: getPayPalWebhookId(),
        webhook_event: JSON.parse(rawBody),
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    return false;
  }

  const body = (await response.json()) as { verification_status?: string };

  return body.verification_status === "SUCCESS";
}
