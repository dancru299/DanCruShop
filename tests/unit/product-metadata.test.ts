import { describe, expect, it } from "vitest";

import {
  getProductCompatibility,
  getProductIncludedItems,
  getProductRequirements,
  getProductSupportNote,
  getProductUpdatePolicy,
} from "@/lib/products/metadata";

const baseProduct = {
  description: null,
  metadata: {},
  product_type: "template" as const,
  short_description: "Template launch page cho builder.",
};

describe("product metadata helpers", () => {
  it("uses metadata values when present", () => {
    const product = {
      ...baseProduct,
      metadata: {
        compatibility: "Next.js 16",
        includes: ["Source", "Docs"],
        requirements: ["Node 20"],
        support_note: "Ping support nếu lỗi tải.",
        update_policy: "Cập nhật qua dashboard.",
      },
    };

    expect(getProductIncludedItems(product)).toEqual(["Source", "Docs"]);
    expect(getProductRequirements(product)).toEqual(["Node 20"]);
    expect(getProductCompatibility(product)).toBe("Next.js 16");
    expect(getProductUpdatePolicy(product)).toBe("Cập nhật qua dashboard.");
    expect(getProductSupportNote(product)).toBe("Ping support nếu lỗi tải.");
  });

  it("falls back to beta-ready defaults", () => {
    expect(getProductIncludedItems(baseProduct)).toHaveLength(4);
    expect(getProductRequirements(baseProduct)[0]).toContain("DanCruShop");
    expect(getProductCompatibility(baseProduct)).toBe(baseProduct.short_description);
    expect(getProductUpdatePolicy(baseProduct)).toContain("dashboard");
    expect(getProductSupportNote(baseProduct)).toContain("7 ngày");
  });
});
