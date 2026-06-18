import type { ReactNode } from "react";
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

const productTypeFiles: Record<
  PublishedProduct["product_type"],
  {
    fileName: string;
    Icon: LucideIcon;
    codeLines: ReactNode[];
  }
> = {
  bundle: {
    fileName: "package.json",
    Icon: Layers3Icon,
    codeLines: [
      <span key="1">{"{"}</span>,
      <span key="2">  <span className="text-pink-400">"name"</span>: <span className="text-emerald-400">"@dancru/bundle"</span>,</span>,
      <span key="3">  <span className="text-pink-400">"version"</span>: <span className="text-emerald-400">"1.0.0"</span>,</span>,
      <span key="4">  <span className="text-pink-400">"items"</span>: [</span>,
      <span key="5">    <span className="text-emerald-400">"nextjs-starter"</span>,</span>,
      <span key="6">    <span className="text-emerald-400">"tailwind-ui"</span></span>,
      <span key="7">  ]</span>,
      <span key="8">{"}"}</span>,
    ],
  },
  course: {
    fileName: "course.md",
    Icon: BookOpenIcon,
    codeLines: [
      <span key="1"><span className="text-blue-400"># Course: NextJS Pro</span></span>,
      <span key="2" className="text-slate-500">## What you will learn:</span>,
      <span key="3">- <span className="text-emerald-400">Turbopack & Routing</span></span>,
      <span key="4">- <span className="text-emerald-400">Server Actions & DB</span></span>,
      <span key="5">- <span className="text-emerald-400">Framer Motion FX</span></span>,
      <span key="6"><span className="text-purple-400">const</span> <span className="text-yellow-400">Level</span> = <span className="text-emerald-400">"Expert"</span>;</span>,
    ],
  },
  digital_download: {
    fileName: "setup.sh",
    Icon: DownloadIcon,
    codeLines: [
      <span key="1" className="text-slate-500">#!/bin/bash</span>,
      <span key="2"><span className="text-purple-400">echo</span> <span className="text-emerald-400">"Extracting archive..."</span></span>,
      <span key="3">tar -xzf download.tar.gz</span>,
      <span key="4"><span className="text-purple-400">cd</span> digital-product</span>,
      <span key="5"><span className="text-purple-400">echo</span> <span className="text-emerald-400">"Installing deps..."</span></span>,
      <span key="6">npm install</span>,
      <span key="7"><span className="text-purple-400">echo</span> <span className="text-cyan-400">"Success!"</span></span>,
    ],
  },
  free_resource: {
    fileName: "resource.go",
    Icon: FileCode2Icon,
    codeLines: [
      <span key="1"><span className="text-purple-400">package</span> main</span>,
      <span key="2"><span className="text-purple-400">import</span> <span className="text-emerald-400">"fmt"</span></span>,
      <span key="3"><span className="text-purple-400">func</span> <span className="text-yellow-400">main</span>() {"{"}</span>,
      <span key="4">  fmt.<span className="text-blue-400">Println</span>(<span className="text-emerald-400">"Free for developers"</span>)</span>,
      <span key="5">  fmt.<span className="text-blue-400">Println</span>(<span className="text-emerald-400">"Download & Code"</span>)</span>,
      <span key="6">{"}"}</span>,
    ],
  },
  template: {
    fileName: "page.tsx",
    Icon: PackageIcon,
    codeLines: [
      <span key="1"><span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> <span className="text-emerald-400">"react"</span>;</span>,
      <span key="2"><span className="text-purple-400">export default function</span> <span className="text-yellow-400">Page</span>() {"{"}</span>,
      <span key="3">  <span className="text-purple-400">return</span> (</span>,
      <span key="4">    <span className="text-blue-400">&lt;</span><span className="text-teal-400">div</span> <span className="text-purple-400">className</span>=<span className="text-emerald-400">"gradient-bg"</span><span className="text-blue-400">&gt;</span></span>,
      <span key="5">      <span className="text-blue-400">&lt;</span><span className="text-yellow-400">BentoGrid</span> <span className="text-blue-400">/&gt;</span></span>,
      <span key="6">    <span className="text-blue-400">&lt;/</span><span className="text-teal-400">div</span><span className="text-blue-400">&gt;</span></span>,
      <span key="7">  );</span>,
      <span key="8">{"}"}</span>,
    ],
  },
  tool: {
    fileName: "tool.config",
    Icon: WrenchIcon,
    codeLines: [
      <span key="1"><span className="text-purple-400">tool</span>:</span>,
      <span key="2">  <span className="text-pink-400">name</span>: <span className="text-emerald-400">DanCruShop-CLI</span></span>,
      <span key="3">  <span className="text-pink-400">version</span>: <span className="text-emerald-400">1.2.0</span></span>,
      <span key="4">  <span className="text-pink-400">features</span>:</span>,
      <span key="5">    - <span className="text-emerald-400">auto_deploy</span></span>,
      <span key="6">    - <span className="text-emerald-400">minify_code</span></span>,
      <span key="7">  <span className="text-pink-400">status</span>: <span className="text-cyan-400">ready</span></span>,
    ],
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
  const fileVisual = productTypeFiles[product.product_type];
  const FileIcon = fileVisual.Icon;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-gradient-to-br",
        visual.accentClassName,
        className
      )}
    >
      {/* Background ambient details */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      <div className="absolute -right-10 -top-10 size-40 rounded-full border border-foreground/5 bg-foreground/[0.01]" />
      <div className="absolute -bottom-14 -left-10 size-44 rounded-full border border-foreground/5 bg-foreground/[0.01]" />

      {/* Mock IDE Window */}
      <div className="absolute inset-3 top-3.5 bottom-3 flex flex-col rounded-lg border border-border/80 bg-neutral-950/90 shadow-2xl backdrop-blur-md transition-all group-hover:border-foreground/20">
        {/* IDE Header */}
        <div className="flex h-7 shrink-0 items-center justify-between border-b border-border/60 bg-neutral-900/40 px-3">
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-red-500/75" />
            <span className="size-1.5 rounded-full bg-yellow-500/75" />
            <span className="size-1.5 rounded-full bg-green-500/75" />
          </div>
          <div className="flex items-center gap-1.5 rounded bg-neutral-900/80 px-2 py-0.5 text-[9px] font-medium text-muted-foreground border border-border/30">
            <FileIcon className="size-2.5 text-primary" />
            <span className="font-mono">{fileVisual.fileName}</span>
          </div>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* IDE Code Content */}
        <div className="flex-1 p-2 font-mono text-[9px] leading-[1.3] text-neutral-300 overflow-hidden select-none">
          <div className="grid gap-0.5">
            {fileVisual.codeLines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="w-3 text-right text-neutral-600 select-none text-[8px] pt-0.5">{idx + 1}</span>
                <span className="truncate flex-1">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const visual = productTypeVisuals[product.product_type];
  const TypeIcon = visual.Icon;
  const discount = getProductDiscount(product);

  return (
    <TiltSpotlight className="group/product-card flex h-full flex-col backdrop-blur-xl">
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

        {/* status badge (top-left): free takes precedence over discount */}
        {product.is_free ? (
          <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur">
            Free
          </span>
        ) : discount ? (
          <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            -{discount.percent}%
          </span>
        ) : null}

        {/* wishlist (top-right) */}
        <FavoriteButton
          className="absolute right-2.5 top-2.5 z-30"
          productId={product.id}
          productTitle={product.title}
        />

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
    </TiltSpotlight>
  );
}
