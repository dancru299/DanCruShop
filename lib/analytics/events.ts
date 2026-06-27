export const analyticsEventNames = [
  "page_view",
  "product_view",
  "add_to_cart",
  "favorite_toggle",
  "compare_add",
  "checkout_start",
  "checkout_error",
  "download_start",
  "download_success",
  "download_error",
  "command_palette_open",
  "command_palette_product_select",
  "command_palette_navigate",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsPayload = {
  anonymousId?: string | null;
  eventName: AnalyticsEventName;
  metadata?: Record<string, unknown>;
  orderId?: string | null;
  path?: string | null;
  productId?: string | null;
  referrer?: string | null;
};

const analyticsEventNameSet = new Set<string>(analyticsEventNames);

function getOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized.slice(0, maxLength) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && analyticsEventNameSet.has(value);
}

export function sanitizeAnalyticsPayload(value: unknown): AnalyticsPayload | null {
  if (!isRecord(value) || !isAnalyticsEventName(value.eventName)) {
    return null;
  }

  const metadata = isRecord(value.metadata) ? value.metadata : {};

  return {
    anonymousId: getOptionalString(value.anonymousId, 128),
    eventName: value.eventName,
    metadata,
    orderId: getOptionalString(value.orderId, 64),
    path: getOptionalString(value.path, 512),
    productId: getOptionalString(value.productId, 64),
    referrer: getOptionalString(value.referrer, 512),
  };
}
