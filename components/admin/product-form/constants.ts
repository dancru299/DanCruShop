import type { ProductStatus, ProductType } from "@/lib/supabase/queries/products";

export const productTypeOptions: Array<{
  label: string;
  value: ProductType;
}> = [
  { label: "Digital download", value: "digital_download" },
  { label: "Course", value: "course" },
  { label: "Tool", value: "tool" },
  { label: "Template", value: "template" },
  { label: "Bundle", value: "bundle" },
  { label: "Free resource", value: "free_resource" },
];

export const productStatusOptions: Array<{
  label: string;
  value: ProductStatus;
}> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "VND", value: "VND" },
] as const;

export const productTypeLabels: Record<ProductType, string> = {
  bundle: "Bundle",
  course: "Course",
  digital_download: "Digital download",
  free_resource: "Free resource",
  template: "Template",
  tool: "Tool",
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
