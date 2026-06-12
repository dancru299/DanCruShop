import { describe, expect, it } from "vitest";

import {
  computeDiscountCents,
  normalizeCouponCode,
} from "@/lib/payments/coupons";

describe("computeDiscountCents", () => {
  it("computes a percentage discount and floors fractional cents", () => {
    expect(
      computeDiscountCents(
        { discount_type: "percent", discount_value: 20 },
        12999
      )
    ).toBe(2599); // floor(12999 * 0.2) = 2599
  });

  it("computes a fixed discount", () => {
    expect(
      computeDiscountCents({ discount_type: "fixed", discount_value: 5000 }, 12000)
    ).toBe(5000);
  });

  it("never discounts more than the subtotal (fixed)", () => {
    expect(
      computeDiscountCents({ discount_type: "fixed", discount_value: 50000 }, 12000)
    ).toBe(12000);
  });

  it("clamps a 100% discount to the subtotal", () => {
    expect(
      computeDiscountCents({ discount_type: "percent", discount_value: 100 }, 8000)
    ).toBe(8000);
  });

  it("returns 0 for a non-positive subtotal", () => {
    expect(
      computeDiscountCents({ discount_type: "percent", discount_value: 50 }, 0)
    ).toBe(0);
    expect(
      computeDiscountCents({ discount_type: "fixed", discount_value: 500 }, -10)
    ).toBe(0);
  });

  it("never returns a negative discount", () => {
    expect(
      computeDiscountCents({ discount_type: "fixed", discount_value: -100 }, 5000)
    ).toBe(0);
  });
});

describe("normalizeCouponCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeCouponCode("  launch20 ")).toBe("LAUNCH20");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeCouponCode("   ")).toBe("");
  });
});
