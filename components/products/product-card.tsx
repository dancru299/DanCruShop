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
import { FavoriteButton } from "@/components/products/favorite-button";
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
            Sẵn sàng
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const visual = productTypeVisuals[product.product_type];
  const TypeIcon = visual.Icon;
  const deliveryLabel = getProductDeliveryLabel(product);

  return (
    <article className="group/product-card relative flex h-full flex-col overflow-hidden rounded-xl border bg-card/65 text-card-foreground shadow-sm backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-xl hover:shadow-foreground/10">
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

        {/* free badge (top-left) */}
        {product.is_free ? (
          <span className="absolute left-3 top-3 z-20 inline-flex items-center rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur">
            Miễn phí
          </span>
        ) : null}

        {/* wishlist (top-right) */}
        <FavoriteButton className="absolute right-3 top-3 z-30" />

        {/* hover overlay: View + Add */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/product-card:pointer-events-auto group-hover/product-card:opacity-100">
          <Link
            href={`/products/${product.slug}`}
            aria-label={`Xem ${product.title}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg transition before:absolute before:inset-0 before:content-[''] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <EyeIcon aria-hidden="true" className="size-4" />
            Xem
          </Link>
          <div className="relative z-10">
            <AddToCartButton
              product={getCartProduct(product)}
              size="sm"
              variant="default"
              className="rounded-full px-4 shadow-lg"
            >
              Thêm
            </AddToCartButton>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <TypeIcon aria-hidden="true" className="size-3.5" />
            {productTypeLabels[product.product_type]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {deliveryLabel}
          </span>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <h3 className="line-clamp-2 text-base font-semibold leading-6 tracking-normal transition-colors group-hover/product-card:text-foreground/80">
            {product.title}
          </h3>
        </Link>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-6 text-muted-foreground">
          {product.short_description ??
            "Tài nguyên số thực dụng cho builder muốn ship nhanh hơn."}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
          <span className="text-lg font-semibold tracking-tight">
            {formatProductPrice(product)}
          </span>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="mb-1 shrink-0 text-muted-foreground transition-[color,transform] duration-300 group-hover/product-card:-translate-y-0.5 group-hover/product-card:translate-x-0.5 group-hover/product-card:text-foreground"
          />
        </div>
      </div>
    </article>
  );
}
