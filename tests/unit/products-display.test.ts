import { describe, expect, it } from "vitest";

import {
  formatPrice,
  formatProductPrice,
  getProductDeliveryLabel,
} from "@/lib/products/display";

describe("product display helpers", () => {
  it("formats VND without decimal fractions", () => {
    expect(formatPrice(125000, "VND")).toBe("125.000 ₫");
  });

  it("formats cent-based currencies with decimals", () => {
    expect(formatPrice(1299, "USD")).toBe("$12.99");
  });

  it("shows free products without looking at price", () => {
    expect(
      formatProductPrice({
        currency: "USD",
        is_free: true,
        price_cents: 9999,
      })
    ).toBe("Free");
  });

  it("returns the expected delivery label", () => {
    expect(getProductDeliveryLabel({ is_free: true })).toBe("Get it free");
    expect(getProductDeliveryLabel({ is_free: false })).toBe("Instant delivery");
  });
});
