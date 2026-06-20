/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  Code2Icon,
  DownloadIcon,
  EyeIcon,
  FileCode2Icon,
  Layers3Icon,
  PackageIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { CompareButton } from "@/components/compare/compare-button";
import type { CompareProduct } from "@/components/compare/compare-provider";
import { FavoriteButton } from "@/components/products/favorite-button";
import { StackBadge } from "@/components/products/stack-badge";
import type { CartProduct } from "@/components/cart/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  formatProductPrice as formatDisplayProductPrice,
  getProductDiscount,
  productTypeLabels,
} from "@/lib/products/display";
import type { PublishedProduct } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

import { TiltSpotlight } from "@/components/ui/tilt-spotlight";

type ProductCardProps = {
  product: PublishedProduct;
  matchPercent?: number;
  layout?: "grid" | "list";
};

const productTypeVisuals: Record<
  PublishedProduct["product_type"],
  {
    accentClassName: string;
    Icon: LucideIcon;
  }
> = {
  bundle: {
    accentClassName: "from-emerald-500/25 via-cyan-500/10 to-background",
    Icon: Layers3Icon,
  },
  course: {
    accentClassName: "from-sky-500/25 via-emerald-500/10 to-background",
    Icon: BookOpenIcon,
  },
  digital_download: {
    accentClassName: "from-cyan-500/25 via-amber-500/10 to-background",
    Icon: DownloadIcon,
  },
  free_resource: {
    accentClassName: "from-lime-500/25 via-cyan-500/10 to-background",
    Icon: FileCode2Icon,
  },
  template: {
    accentClassName: "from-amber-500/25 via-emerald-500/10 to-background",
    Icon: PackageIcon,
  },
  tool: {
    accentClassName: "from-rose-500/20 via-cyan-500/10 to-background",
    Icon: WrenchIcon,
  },
};

export function formatProductPrice(product: PublishedProduct) {
  return formatDisplayProductPrice(product);
}

function getCartProduct(product: PublishedProduct): CartProduct {
  return {
    currency: product.currency,
    id: product.id,
    isFree: product.is_free,
    priceCents: product.price_cents,
    productType: product.product_type,
    slug: product.slug,
    thumbnailUrl: product.thumbnail_url,
    title: product.title,
  };
}

function getCompareProduct(product: PublishedProduct): CompareProduct {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    thumbnailUrl: product.thumbnail_url,
    productType: product.product_type,
  };
}

export function ProductArtwork({
  product,
  className,
}: ProductCardProps & {
  className?: string;
}) {
  const visual = productTypeVisuals[product.product_type];
  const Icon = visual.Icon;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-gradient-to-br",
        visual.accentClassName,
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      <div className="absolute -right-10 -top-10 size-40 rounded-full border border-foreground/10" />
      <div className="absolute -bottom-14 -left-10 size-44 rounded-full border border-foreground/10" />

      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              DanCruShop
            </span>
            <span className="text-sm font-semibold">
              {productTypeLabels[product.product_type]}
            </span>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg border bg-background/70 text-foreground shadow-sm backdrop-blur">
            <Icon aria-hidden="true" className="size-5" />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="h-2 w-28 rounded-full bg-foreground/70" />
          <div className="h-2 w-40 rounded-full bg-foreground/25" />
          <div className="h-2 w-24 rounded-full bg-foreground/20" />
        </div>

        <div className="flex items-end justify-between gap-4">
          <Code2Icon aria-hidden="true" className="size-8 text-foreground/45" />
          <span className="rounded-md border bg-background/70 px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product, matchPercent, layout = "grid" }: ProductCardProps) {
  const visual = productTypeVisuals[product.product_type];
  const TypeIcon = visual.Icon;
  const discount = getProductDiscount(product);

  const isPerfectMatch = matchPercent === 100;
  const isList = layout === "list";

  if (isList) {
    return (
      <TiltSpotlight
        className={cn(
          "group/product-card backdrop-blur-xl",
          isPerfectMatch &&
            "ring-2 ring-emerald-500/70 shadow-[0_0_22px_rgba(16,185,129,0.45)]"
        )}
      >
        <div className="flex flex-col sm:flex-row gap-4 p-3 h-full w-full">
          {/* Left Side: Image */}
          <div className="relative aspect-[4/3] sm:aspect-video w-full sm:w-52 md:w-60 shrink-0 overflow-hidden bg-muted rounded-lg">
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.title}
                className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/product-card:scale-105"
              />
            ) : (
              <ProductArtwork product={product} />
            )}

            {/* bottom vignette */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/30 to-transparent" />

            {/* match badge */}
            {matchPercent != null ? (
              <div className="absolute left-2.5 top-2.5 z-20">
                <StackBadge matchPercent={matchPercent} />
              </div>
            ) : null}

            {/* status badge */}
            {matchPercent == null && product.is_free ? (
              <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                Free
              </span>
            ) : matchPercent == null && discount ? (
              <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                -{discount.percent}%
              </span>
            ) : null}

            {/* wishlist + compare */}
            <div className="absolute right-2 top-2 z-30 flex items-center gap-1">
              <CompareButton product={getCompareProduct(product)} />
              <FavoriteButton
                productId={product.id}
                productTitle={product.title}
              />
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="flex flex-1 flex-col justify-between gap-3 py-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <TypeIcon aria-hidden="true" className="size-3" />
                  {productTypeLabels[product.product_type]}
                </span>
              </div>

              <Link
                href={`/products/${product.slug}`}
                className="focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <h3 className="text-base font-semibold leading-5 tracking-normal transition-colors hover:text-foreground/80">
                  {product.title}
                </h3>
              </Link>

              {product.short_description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                  {product.short_description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 mt-auto">
              <div className="flex min-w-0 flex-col leading-tight">
                {discount ? (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {discount.originalLabel}
                  </span>
                ) : null}
                <span className="text-lg font-bold tracking-tight text-primary">
                  {formatProductPrice(product)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/products/${product.slug}`}
                  aria-label={`View ${product.title}`}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "h-8 rounded-full px-3 text-[11px] font-medium"
                  )}
                >
                  <EyeIcon aria-hidden="true" className="size-3.5 mr-1" />
                  View
                </Link>
                <AddToCartButton
                  product={getCartProduct(product)}
                  size="sm"
                  variant="default"
                  className="h-8 rounded-full px-4 text-[11px] font-semibold"
                >
                  Add
                </AddToCartButton>
              </div>
            </div>
          </div>
        </div>
      </TiltSpotlight>
    );
  }

  return (
    <TiltSpotlight
      className={cn(
        "group/product-card backdrop-blur-xl",
        isPerfectMatch &&
          "ring-2 ring-emerald-500/70 shadow-[0_0_22px_rgba(16,185,129,0.45)]"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/product-card:scale-105"
            />
          ) : (
            <ProductArtwork product={product} />
          )}

          {/* bottom vignette for depth */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />

          {/* match badge (top-left): stack match indicator */}
          {matchPercent != null ? (
            <div className="absolute left-2.5 top-2.5 z-20">
              <StackBadge matchPercent={matchPercent} />
            </div>
          ) : null}

          {/* status badge (top-left): free takes precedence over discount */}
          {matchPercent == null && product.is_free ? (
            <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur">
              Free
            </span>
          ) : matchPercent == null && discount ? (
            <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              -{discount.percent}%
            </span>
          ) : null}

          {/* wishlist + compare (top-right) */}
          <div className="absolute right-2.5 top-2.5 z-30 flex items-center gap-1.5">
            <CompareButton product={getCompareProduct(product)} />
            <FavoriteButton
              productId={product.id}
              productTitle={product.title}
            />
          </div>

          {/* hover overlay: View + Add */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/product-card:pointer-events-auto group-hover/product-card:opacity-100">
            <Link
              href={`/products/${product.slug}`}
              aria-label={`View ${product.title}`}
              className={cn(
                buttonVariants({ size: "sm", variant: "secondary" }),
                "h-8 min-w-20 rounded-full bg-white/95 px-4 text-neutral-900 shadow-lg hover:bg-white"
              )}
            >
              <EyeIcon aria-hidden="true" data-icon="inline-start" />
              View
            </Link>
            <div className="relative z-10">
              <AddToCartButton
                product={getCartProduct(product)}
                size="sm"
                variant="default"
                className="h-8 min-w-20 rounded-full px-4 shadow-lg"
              >
                Add
              </AddToCartButton>
            </div>
          </div>
        </div>

        {/* Body — compact: type tag, title, price */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <TypeIcon aria-hidden="true" className="size-3" />
            {productTypeLabels[product.product_type]}
          </span>

          <Link
            href={`/products/${product.slug}`}
            className="focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 tracking-normal transition-colors group-hover/product-card:text-foreground/80">
              {product.title}
            </h3>
          </Link>

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div className="flex min-w-0 flex-col leading-tight">
              {discount ? (
                <span className="text-xs text-muted-foreground line-through">
                  {discount.originalLabel}
                </span>
              ) : null}
              <span className="text-base font-bold tracking-tight text-primary">
                {formatProductPrice(product)}
              </span>
            </div>
            <ArrowUpRightIcon
              aria-hidden="true"
              className="mb-0.5 shrink-0 text-muted-foreground transition-[color,transform] duration-300 group-hover/product-card:-translate-y-0.5 group-hover/product-card:translate-x-0.5 group-hover/product-card:text-foreground"
            />
          </div>
        </div>
      </div>
    </TiltSpotlight>
  );
}
