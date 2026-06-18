import { describe, expect, it } from "vitest";

import {
  getCartCheckoutReadiness,
  getCartCheckoutWarning,
} from "@/lib/cart/checkout-readiness";

describe("cart checkout readiness", () => {
  it("detects free-only carts", () => {
    const items = [{ currency: "USD", isFree: true }];

    expect(getCartCheckoutReadiness(items)).toMatchObject({
      hasMixedCurrencies: false,
      isFreeOnly: true,
      paidCurrencies: [],
    });
    expect(getCartCheckoutWarning(items)).toContain("free resources");
  });

  it("detects VND carts that can use VietQR", () => {
    expect(
      getCartCheckoutReadiness([{ currency: "vnd", isFree: false }])
    ).toMatchObject({
      canUseVietQr: true,
      paidCurrencies: ["VND"],
    });
  });

  it("warns when a cart has mixed paid currencies", () => {
    const items = [
      { currency: "USD", isFree: false },
      { currency: "VND", isFree: false },
    ];

    expect(getCartCheckoutReadiness(items).hasMixedCurrencies).toBe(true);
    expect(getCartCheckoutWarning(items)).toContain("multiple currencies");
  });
});
