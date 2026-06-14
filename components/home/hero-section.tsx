/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import {
  formatProductPrice,
  getProductDeliveryLabel,
  productTypeLabels,
} from "@/lib/products/display";
import {
  getPublishedProducts,
  type PublishedProduct,
} from "@/lib/supabase/queries/products";
import { ProductArtwork } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroSection as HeroSectionConfig } from "@/lib/store/home-layout";

function HeroCtas({ section }: { section: HeroSectionConfig }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {section.primaryCta.label ? (
        <Button size="lg" render={<Link href={section.primaryCta.href || "#"} />} nativeButton={false}>
          {section.primaryCta.label}
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      ) : null}
      {section.secondaryCta.label ? (
        <Button
          size="lg"
          variant="outline"
          render={<Link href={section.secondaryCta.href || "#"} />}
          nativeButton={false}
        >
          {section.secondaryCta.label}
        </Button>
      ) : null}
    </div>
  );
}

function HeroSignals({
  section,
  className,
}: {
  section: HeroSectionConfig;
  className?: string;
}) {
  if (section.signals.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>
      {section.signals.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className="rounded-2xl border border-border/80 bg-card/55 p-4 shadow-sm backdrop-blur-xl"
        >
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export async function HeroSection({ section }: { section: HeroSectionConfig }) {
  const product =
    section.showSpotlight && section.variant === "split"
      ? (await getPublishedProducts(1))[0]
      : undefined;

  if (section.variant !== "split") {
    const centered = section.variant === "centered";

    return (
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary)_0,transparent_40%)] opacity-25" />
        <div
          className={cn(
            "relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-12 md:py-16",
            centered && "items-center text-center"
          )}
        >
          {section.eyebrow ? (
            <div className="inline-flex w-fit items-center rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              {section.eyebrow}
            </div>
          ) : null}
          <h1 className="max-w-4xl text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-4xl md:text-5xl">
            {section.title}
          </h1>
          {section.subtitle ? (
            <p
              className={cn(
                "max-w-2xl text-base leading-7 text-muted-foreground md:text-lg",
                centered && "mx-auto"
              )}
            >
              {section.subtitle}
            </p>
          ) : null}
          <HeroCtas section={section} />
          {centered ? <HeroSignals section={section} className="mt-4 w-full" /> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-border/80">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_32%),radial-gradient(circle_at_top_right,var(--muted)_0,transparent_38%)] opacity-35" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.06]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12">
        <div className="flex max-w-3xl flex-col gap-5">
          {section.eyebrow ? (
            <div className="inline-flex w-fit items-center rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              {section.eyebrow}
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            <h1 className="max-w-4xl text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-4xl md:text-5xl lg:text-6xl">
              {section.title}
            </h1>
            {section.subtitle ? (
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                {section.subtitle}
              </p>
            ) : null}
          </div>

          <HeroCtas section={section} />
          <HeroSignals section={section} className="hidden md:grid" />
        </div>

        {section.showSpotlight ? (
          <div className="hidden lg:block">
            <HeroProductSpotlight product={product} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HeroProductSpotlight({ product }: { product?: PublishedProduct }) {
  const detailRows = [
    {
      label: "Loại",
      value: product ? productTypeLabels[product.product_type] : "Marketplace",
    },
    {
      label: "Giao hàng",
      value: product ? getProductDeliveryLabel(product) : "Mở khóa trong tài khoản",
    },
    {
      label: "Giá",
      value: product ? formatProductPrice(product) : "Đang cập nhật",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute inset-x-10 bottom-2 top-10 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Đang mở bán
            </span>
          </div>
          <span className="rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {product ? productTypeLabels[product.product_type] : "Sản phẩm mẫu"}
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,11rem)_1fr] sm:p-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/80 bg-muted">
            {product?.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.title}
                className="absolute inset-0 size-full object-cover"
              />
            ) : product ? (
              <ProductArtwork product={product} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_38%),linear-gradient(180deg,var(--muted),var(--background))] opacity-60" />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Gợi ý trong tuần
              </p>
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em]">
                {product?.title ?? "Kho tool đang được cập nhật"}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {product?.short_description ??
                  "Danh sách sản phẩm sẽ hiện tại đây ngay khi có món được publish từ CMS."}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/80 bg-background/70 p-3">
              {detailRows.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-right font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full sm:w-fit"
              render={
                <Link href={product ? `/products/${product.slug}` : "/products"} />
              }
              nativeButton={false}
              variant="secondary"
            >
              Xem chi tiết
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
