/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import type { PublishedProduct } from "@/lib/supabase/queries/products";

type ProductCardProps = {
  product: PublishedProduct;
};

const productTypeLabels: Record<PublishedProduct["product_type"], string> = {
  bundle: "Bundle",
  course: "Course",
  digital_download: "Download",
  free_resource: "Resource",
  template: "Template",
  tool: "Tool",
};

function formatPrice(product: PublishedProduct) {
  if (product.is_free) {
    return "Free";
  }

  const currency = product.currency.trim().toUpperCase() || "USD";
  const amount = currency === "VND" ? product.price_cents : product.price_cents / 100;

  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
    style: "currency",
  }).format(amount);
}

export function ProductCard({ product }: ProductCardProps) {
  const thumbnailSrc = product.thumbnail_url ?? "/window.svg";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-ring/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={thumbnailSrc}
          alt={product.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              {productTypeLabels[product.product_type]}
            </p>
            <h3 className="line-clamp-2 text-base font-semibold leading-6 tracking-normal">
              {product.title}
            </h3>
          </div>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          />
        </div>

        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
          {product.short_description ??
            "A practical digital resource for builders who want to ship faster."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-sm text-muted-foreground">Lifetime access</span>
          <span className="text-sm font-semibold">{formatPrice(product)}</span>
        </div>
      </div>
    </Link>
  );
}
