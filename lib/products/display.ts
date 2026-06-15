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
  course: "Khóa học",
  digital_download: "Tải xuống số",
  free_resource: "Tài nguyên miễn phí",
  template: "Template",
  tool: "Tool",
};

export const productTypeDescriptions: Record<ProductType, string> = {
  bundle: "Bộ tài nguyên đóng gói sẵn gồm file, hướng dẫn và các thành phần liên quan.",
  course: "Tài nguyên học có cấu trúc với bài học, file và ghi chú triển khai.",
  digital_download: "Tệp số giao ngay để thêm thẳng vào workflow làm việc của bạn.",
  free_resource: "Tài nguyên miễn phí có thể nhận và lưu lại trong thư viện đã mua.",
  template: "Starter, template hoặc layout tái sử dụng cho dự án thật.",
  tool: "Công cụ tập trung giải quyết một công việc thực tế trong workflow.",
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
    return "Miễn phí";
  }

  return formatPrice(product.price_cents, product.currency);
}

export function getProductDeliveryLabel(product: Pick<PublishedProduct, "is_free">) {
  return product.is_free ? "Nhận miễn phí" : "Giao ngay";
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
