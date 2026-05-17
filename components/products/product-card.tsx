/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  Code2Icon,
  DownloadIcon,
  FileCode2Icon,
  Layers3Icon,
  PackageIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { CartProduct } from "@/components/cart/cart-provider";
import {
  formatProductPrice as formatDisplayProductPrice,
  getProductDeliveryLabel,
  productTypeLabels,
} from "@/lib/products/display";
import type { PublishedProduct } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: PublishedProduct;
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
        "motion-gradient-pan absolute inset-0 overflow-hidden bg-gradient-to-br",
        visual.accentClassName,
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      <div className="motion-scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-foreground/10 to-transparent" />
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

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group/product-card flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-xl hover:shadow-foreground/10">
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/product-card:scale-105"
            />
          ) : (
            <ProductArtwork product={product} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/product-card:opacity-100" />
          <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-foreground/15 to-transparent opacity-0 transition-all duration-700 group-hover/product-card:left-full group-hover/product-card:opacity-100" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              {productTypeLabels[product.product_type]}
            </p>
            <Link
              href={`/products/${product.slug}`}
              className="focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <h3 className="line-clamp-2 text-base font-semibold leading-6 tracking-normal transition-colors group-hover/product-card:text-foreground/80">
                {product.title}
              </h3>
            </Link>
          </div>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-muted-foreground transition-[color,transform] duration-300 group-hover/product-card:-translate-y-0.5 group-hover/product-card:translate-x-0.5 group-hover/product-card:text-foreground"
          />
        </div>

        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
          {product.short_description ??
            "A practical digital resource for builders who want to ship faster."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold">
              {formatProductPrice(product)}
            </span>
            <span className="text-xs text-muted-foreground">
              {getProductDeliveryLabel(product)}
            </span>
          </div>
          <AddToCartButton
            product={getCartProduct(product)}
            size="sm"
            className="shrink-0"
          >
            Add
          </AddToCartButton>
        </div>
      </div>
    </article>
  );
}

