import { productTypeDescriptions } from "@/lib/products/display";
import type { ProductType } from "@/lib/supabase/queries/products";

export type ProductMetadata = Record<string, unknown>;

type ProductMetadataSource = {
  description: string | null;
  metadata: ProductMetadata;
  product_type: ProductType;
  short_description: string | null;
};

export function getStringArrayFromProductMetadata(
  metadata: ProductMetadata,
  key: string
) {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  return items.length > 0 ? items : null;
}

export function getStringFromProductMetadata(
  metadata: ProductMetadata,
  key: string
) {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getProductIncludedItems(product: ProductMetadataSource) {
  const metadataItems =
    getStringArrayFromProductMetadata(product.metadata, "includes") ??
    getStringArrayFromProductMetadata(product.metadata, "features") ??
    getStringArrayFromProductMetadata(product.metadata, "highlights");

  if (metadataItems) {
    return metadataItems;
  }

  const descriptionLines = product.description
    ?.split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (descriptionLines && descriptionLines.length >= 3) {
    return descriptionLines.slice(0, 6);
  }

  return [
    "Mở quyền truy cập ngay sau khi thanh toán thành công",
    "Gói tài nguyên gọn, sẵn sàng cho dự án thật",
    "Có context, ghi chú setup và hướng dẫn sử dụng thực tế",
    "Bản cập nhật sau này được giao qua dashboard đã mua",
  ];
}

export function getProductRequirements(product: ProductMetadataSource) {
  return (
    getStringArrayFromProductMetadata(product.metadata, "requirements") ?? [
      "Có tài khoản DanCruShop để mở dashboard sau checkout.",
      "Đọc phần mô tả, tech stack và license trước khi dùng cho dự án thật.",
    ]
  );
}

export function getProductCompatibility(product: ProductMetadataSource) {
  return (
    getStringFromProductMetadata(product.metadata, "compatibility") ??
    product.short_description ??
    productTypeDescriptions[product.product_type]
  );
}

export function getProductUpdatePolicy(product: ProductMetadataSource) {
  return (
    getStringFromProductMetadata(product.metadata, "update_policy") ??
    "Người mua được mở lại bản cập nhật qua dashboard khi shop publish phiên bản mới."
  );
}

export function getProductSupportNote(product: ProductMetadataSource) {
  return (
    getStringFromProductMetadata(product.metadata, "support_note") ??
    "Nếu tài nguyên không truy cập được hoặc mô tả sai, liên hệ support trong 7 ngày."
  );
}
