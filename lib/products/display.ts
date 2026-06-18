import type {
  ProductDetail,
  ProductType,
  PublishedProduct,
} from "@/lib/supabase/queries/products";

type PricedProduct = Pick<
  PublishedProduct | ProductDetail,
  "currency" | "is_free" | "price_cents"
>;

export const productTypeLabels: Record<ProductType, string> = {
  bundle: "Bundle",
  course: "Course",
  digital_download: "Digital download",
  free_resource: "Free resource",
  template: "Template",
  tool: "Tool",
};

export const productTypeDescriptions: Record<ProductType, string> = {
  bundle: "A ready-packaged set of files, guides, and related components.",
  course: "Structured learning with lessons, files, and implementation notes.",
  digital_download: "Instant-delivery digital files to drop straight into your workflow.",
  free_resource: "A free resource you can claim and keep in your purchased library.",
  template: "A reusable starter, template, or layout for real projects.",
  tool: "A focused tool that solves one real job in your workflow.",
};

export function formatPrice(priceCents: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase() || "USD";
  const amount =
    normalizedCurrency === "VND" ? priceCents : priceCents / 100;

  return new Intl.NumberFormat(
    normalizedCurrency === "VND" ? "vi-VN" : "en-US",
    {
      currency: normalizedCurrency,
      maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 2,
      style: "currency",
    }
  ).format(amount);
}

export function formatProductPrice(product: PricedProduct) {
  if (product.is_free) {
    return "Free";
  }

  return formatPrice(product.price_cents, product.currency);
}

export function getProductDeliveryLabel(product: Pick<PublishedProduct, "is_free">) {
  return product.is_free ? "Get it free" : "Instant delivery";
}

type DiscountProduct = Pick<
  PublishedProduct | ProductDetail,
  "currency" | "is_free" | "price_cents" | "compare_at_price_cents"
>;

/**
 * Returns discount badge data (percent off + formatted original price) when the
 * product has a valid higher "compare at" price, otherwise null.
 */
export function getProductDiscount(product: DiscountProduct) {
  const original = product.compare_at_price_cents;

  if (
    product.is_free ||
    original == null ||
    original <= product.price_cents ||
    product.price_cents <= 0
  ) {
    return null;
  }

  const percent = Math.round((1 - product.price_cents / original) * 100);

  if (percent <= 0) {
    return null;
  }

  return {
    percent,
    originalLabel: formatPrice(original, product.currency),
  };
}
