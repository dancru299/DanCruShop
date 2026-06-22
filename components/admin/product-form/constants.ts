import type { ProductStatus, ProductType } from "@/lib/supabase/queries/products";

export const productTypeOptions: Array<{
  label: string;
  value: ProductType;
}> = [
  { label: "Tải về", value: "digital_download" },
  { label: "Khóa học", value: "course" },
  { label: "Công cụ", value: "tool" },
  { label: "Mẫu", value: "template" },
  { label: "Bộ", value: "bundle" },
  { label: "Miễn phí", value: "free_resource" },
];

export const productStatusOptions: Array<{
  label: string;
  value: ProductStatus;
}> = [
  { label: "Bản nháp", value: "draft" },
  { label: "Đã xuất bản", value: "published" },
  { label: "Đã lưu trữ", value: "archived" },
];

export const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "VND", value: "VND" },
] as const;

export const productTypeLabels: Record<ProductType, string> = {
  bundle: "Bộ",
  course: "Khóa học",
  digital_download: "Tải về",
  free_resource: "Miễn phí",
  template: "Mẫu",
  tool: "Công cụ",
};

export const productStatusLabels: Record<ProductStatus, string> = {
  archived: "Đã lưu trữ",
  draft: "Bản nháp",
  published: "Đã xuất bản",
};

export const statusBadgeVariants: Record<ProductStatus, "default" | "outline" | "secondary"> = {
  archived: "outline",
  draft: "secondary",
  published: "default",
};

export function formatPriceInput(priceCents: number | undefined, currency: string) {
  if (typeof priceCents !== "number") {
    return "0";
  }

  if (currency === "VND") {
    return String(priceCents);
  }

  return (priceCents / 100).toFixed(2).replace(/\.00$/, "");
}

export function parsePriceCents(value: string, currency: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  if (currency === "VND") {
    return Math.round(parsed);
  }

  return Math.round(parsed * 100);
}
