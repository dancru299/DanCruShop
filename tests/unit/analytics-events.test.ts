import { describe, expect, it } from "vitest";

import {
  isAnalyticsEventName,
  sanitizeAnalyticsPayload,
} from "@/lib/analytics/events";

describe("analytics event validation", () => {
  it("accepts known events and trims optional string fields", () => {
    expect(isAnalyticsEventName("checkout_start")).toBe(true);

    expect(
      sanitizeAnalyticsPayload({
        anonymousId: " anon-1 ",
        eventName: "product_view",
        metadata: { slug: "claude-max" },
        path: " /products/claude-max ",
        productId: " product-1 ",
        referrer: " https://example.com ",
      })
    ).toEqual({
      anonymousId: "anon-1",
      eventName: "product_view",
      metadata: { slug: "claude-max" },
      orderId: null,
      path: "/products/claude-max",
      productId: "product-1",
      referrer: "https://example.com",
    });
  });

  it("rejects unknown events and non-object payloads", () => {
    expect(isAnalyticsEventName("unknown_event")).toBe(false);
    expect(sanitizeAnalyticsPayload(null)).toBeNull();
    expect(sanitizeAnalyticsPayload({ eventName: "unknown_event" })).toBeNull();
  });
});
