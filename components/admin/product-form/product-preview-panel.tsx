/* eslint-disable @next/next/no-img-element */

import { ArrowUpRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ProductArtwork,
  formatProductPrice,
} from "@/components/products/product-card";
import { statusBadgeVariants, productTypeLabels } from "./constants";
import type { ProductStatus, ProductType, PublishedProduct } from "@/lib/supabase/queries/products";

type ProductPreviewPanelProps = {
  currency: string;
  description: string;
  demoUrl: string;
  priceCents: number;
  compareCents: number | null;
  productType: ProductType;
  previewUrl: string;
  shortDescription: string;
  slug: string;
  status: ProductStatus;
  thumbnailUrl: string;
  title: string;
};

export function ProductPreviewPanel({
  currency,
  description,
  demoUrl,
  priceCents,
  compareCents,
  productType,
  previewUrl,
  shortDescription,
  slug,
  status,
  thumbnailUrl,
  title,
}: ProductPreviewPanelProps) {
  const previewProduct: PublishedProduct = {
    currency,
    id: "preview",
    is_free: priceCents === 0 || productType === "free_resource",
    price_cents: priceCents,
    compare_at_price_cents: compareCents,
    product_type: productType,
    short_description: shortDescription.trim() || null,
    slug: slug || "product-slug",
    thumbnail_url: thumbnailUrl.trim() || null,
    title: title.trim() || "Untitled product",
  };
  const descriptionLines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {previewProduct.thumbnail_url ? (
            <img
              alt={previewProduct.title}
              className="absolute inset-0 size-full object-cover"
              src={previewProduct.thumbnail_url}
            />
          ) : (
            <ProductArtwork product={previewProduct} />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-4">
            <Badge variant={statusBadgeVariants[status]}>{status}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {productTypeLabels[productType]}
              </p>
              <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-7 tracking-normal">
                {previewProduct.title}
              </h2>
            </div>
            <ArrowUpRightIcon
              aria-hidden="true"
              className="mt-1 shrink-0 text-muted-foreground"
            />
          </div>

          <p className="line-clamp-3 min-h-16 text-sm leading-6 text-muted-foreground">
            {previewProduct.short_description ??
              "A concise product summary will appear here on public cards."}
          </p>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <span className="text-sm text-muted-foreground">Lifetime access</span>
            <span className="text-sm font-semibold">
              {formatProductPrice(previewProduct)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Public detail preview</h3>
            <p className="text-xs text-muted-foreground">
              /products/{previewProduct.slug}
            </p>
          </div>
          <Badge variant="outline">Preview</Badge>
        </div>

        <div className="mt-4 grid gap-3 text-sm">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Description</p>
            {descriptionLines.length > 0 ? (
              <div className="mt-2 grid gap-1 text-xs leading-5">
                {descriptionLines.map((line) => (
                  <p key={line} className="line-clamp-1">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Add a full description to make the detail page feel complete.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Demo</p>
              <p className="mt-1 truncate text-xs">
                {demoUrl.trim() ? "Connected" : "Missing"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Preview</p>
              <p className="mt-1 truncate text-xs">
                {previewUrl.trim() ? "Connected" : "Missing"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
