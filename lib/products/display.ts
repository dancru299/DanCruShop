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
  bundle: "A packaged set of assets, files, and guidance.",
  course: "Structured learning material with lessons and resources.",
  digital_download: "Instantly delivered digital files for your workflow.",
  free_resource: "A free resource you can claim and keep in your library.",
  template: "A reusable starter, template, or production-ready layout.",
  tool: "A focused tool or utility built to solve a practical job.",
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
  return product.is_free ? "Free claim" : "Instant delivery";
}

