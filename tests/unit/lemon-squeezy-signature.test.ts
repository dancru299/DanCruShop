import crypto from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyWebhookSignature } from "@/lib/payments/lemon-squeezy";

const SECRET = "test-webhook-secret";

function sign(payload: string, secret = SECRET) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const originalSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    } else {
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("accepts a signature computed with the shared secret", () => {
    const payload = JSON.stringify({ meta: { event_name: "order_created" } });

    expect(verifyWebhookSignature(payload, sign(payload))).toBe(true);
  });

  it("rejects a valid signature once the payload is tampered with", () => {
    const payload = JSON.stringify({ data: { attributes: { total: 100 } } });
    const signature = sign(payload);
    const tamperedPayload = JSON.stringify({
      data: { attributes: { total: 999_999 } },
    });

    expect(verifyWebhookSignature(tamperedPayload, signature)).toBe(false);
  });

  it("rejects a signature generated with a different secret", () => {
    const payload = "{}";

    expect(verifyWebhookSignature(payload, sign(payload, "attacker-secret"))).toBe(
      false
    );
  });

  it("rejects a signature of the wrong length without throwing", () => {
    // Guards the timingSafeEqual length pre-check: unequal buffer lengths would
    // otherwise make crypto.timingSafeEqual throw instead of returning false.
    expect(verifyWebhookSignature("{}", "deadbeef")).toBe(false);
  });

  it("throws when the webhook secret is not configured", () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    expect(() => verifyWebhookSignature("{}", sign("{}"))).toThrow(
      /LEMONSQUEEZY_WEBHOOK_SECRET/
    );
  });
});
