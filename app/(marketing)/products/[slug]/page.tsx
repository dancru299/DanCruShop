/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ExternalLinkIcon,
  Layers3Icon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";

import { ProductCta } from "@/components/products/product-cta";
import { ProductArtwork } from "@/components/products/product-card";
import { ProductReviews } from "@/components/products/product-reviews";
import { Badge } from "@/components/ui/badge";
import {
  formatProductPrice,
  productTypeDescriptions,
  productTypeLabels,
} from "@/lib/products/display";
import { checkUserAccess } from "@/lib/supabase/queries/purchases";
import { getProductReviews } from "@/lib/supabase/queries/product-reviews";
import {
  getProductBySlug,
  type ProductDetail,
} from "@/lib/supabase/queries/products";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ViewerState = {
  isAdmin: boolean;
  isAuthenticated: boolean;
  userId: string | null;
};

export const dynamic = "force-dynamic";

function getStringArrayFromMetadata(
  metadata: ProductDetail["metadata"],
  key: string
) {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter(
    (item): item is string => typeof item === "string" && item.length > 0
  );

  return items.length > 0 ? items : null;
}

function getStringFromMetadata(metadata: ProductDetail["metadata"], key: string) {
  const value = metadata[key];

  return typeof value === "string" && value.length > 0 ? value : null;
}

function getTechStack(product: ProductDetail) {
  return (
    getStringArrayFromMetadata(product.metadata, "tech_stack") ?? [
      "Next.js",
      "Supabase",
      "Tailwind CSS",
    ]
  );
}

function getLicense(product: ProductDetail) {
  return (
    getStringFromMetadata(product.metadata, "license") ??
    "Personal and commercial use for your own projects."
  );
}

function getAudience(product: ProductDetail) {
  return (
    getStringFromMetadata(product.metadata, "audience") ??
    "Builders, makers, and developers shipping practical products."
  );
}

function getIncludedItems(product: ProductDetail) {
  const metadataItems =
    getStringArrayFromMetadata(product.metadata, "includes") ??
    getStringArrayFromMetadata(product.metadata, "features") ??
    getStringArrayFromMetadata(product.metadata, "highlights");

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
    "Instant access after successful checkout",
    "A clean product package ready for real projects",
    "Context, setup notes, and practical usage guidance",
    "Future updates delivered through your buyer dashboard",
  ];
}

function getDescriptionParagraphs(product: ProductDetail) {
  if (!product.description) {
    return [
      product.short_description ??
        productTypeDescriptions[product.product_type],
    ];
  }

  const paragraphs = product.description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return paragraphs.length > 0 ? paragraphs : [product.description];
}

function getCategoryLabels(product: ProductDetail) {
  const metadataCategories =
    getStringArrayFromMetadata(product.metadata, "categories") ??
    getStringArrayFromMetadata(product.metadata, "category") ??
    (getStringFromMetadata(product.metadata, "category")
      ? [getStringFromMetadata(product.metadata, "category") as string]
      : null);
  const categoryLabels = product.categories.map((category) => category.name);

  return categoryLabels.length > 0
    ? categoryLabels
    : metadataCategories ?? [productTypeLabels[product.product_type]];
}

function getProductTags(product: ProductDetail, categoryLabels: string[]) {
  const seen = new Set<string>();
  const tags = [
    productTypeLabels[product.product_type],
    ...categoryLabels,
    product.is_free ? "Free" : null,
  ];

  return tags.filter((tag): tag is string => {
    const key = tag?.trim().toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

async function getViewerState(): Promise<ViewerState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { isAdmin: false, isAuthenticated: false, userId: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return {
      isAdmin: profile?.role === "admin",
      isAuthenticated: true,
      userId: user.id,
    };
  } catch {
    return { isAdmin: false, isAuthenticated: false, userId: null };
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.title,
    description:
      product.short_description ??
      "Explore this digital product on DanCruShop.",
    openGraph: {
      title: product.title,
      description:
        product.short_description ??
        "Explore this digital product on DanCruShop.",
      images: product.thumbnail_url ? [product.thumbnail_url] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const viewer = await getViewerState();
  const [hasPurchased, reviewsData] = await Promise.all([
    viewer.userId ? checkUserAccess(viewer.userId, product.id) : false,
    getProductReviews(product.id),
  ]);
  const techStack = getTechStack(product);
  const license = getLicense(product);
  const includedItems = getIncludedItems(product);
  const categoryLabels = getCategoryLabels(product);
  const productTags = getProductTags(product, categoryLabels);
  const descriptionParagraphs = getDescriptionParagraphs(product);
  const canReply = hasPurchased || viewer.isAdmin;

  return (
    <div className="bg-background">
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 pb-10 pt-8 md:pb-14 md:pt-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
          <div className="motion-fade-up flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-lg border bg-card p-3 shadow-2xl shadow-foreground/5">
              <div className="relative aspect-[16/11] overflow-hidden rounded-md bg-[radial-gradient(circle_at_top_left,var(--muted),transparent_34%),linear-gradient(135deg,var(--background),var(--muted))]">
                {product.thumbnail_url ? (
                  <div className="absolute inset-5 flex items-center justify-center">
                    <img
                      src={product.thumbnail_url}
                      alt={product.title}
                      className="max-h-full max-w-full object-contain drop-shadow-2xl"
                    />
                  </div>
                ) : (
                  <ProductArtwork product={product} />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {product.demo_url ? (
                <Link
                  href={product.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  View live demo
                  <ExternalLinkIcon aria-hidden="true" className="size-4" />
                </Link>
              ) : null}
              {product.preview_url ? (
                <Link
                  href={product.preview_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Open preview
                  <ExternalLinkIcon aria-hidden="true" className="size-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="motion-fade-up motion-delay-1 flex flex-col gap-4 lg:pt-1">
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {productTags.map((tag, index) => (
                <Badge
                  key={tag}
                  variant={index === 0 ? "secondary" : "outline"}
                  className="h-6 px-2.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-semibold leading-[1.04] tracking-normal text-balance md:text-5xl">
                {product.title}
              </h1>
              {product.short_description ? (
                <p className="text-base leading-7 text-muted-foreground md:text-lg">
                  {product.short_description}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-2.5">
                <div className="flex items-center gap-1 text-amber-400">
                  <StarIcon aria-hidden="true" className="size-4 fill-current" />
                  <span className="text-sm font-semibold text-foreground">
                    {reviewsData.summary.totalReviews > 0
                      ? reviewsData.summary.averageRating.toFixed(1)
                      : "New"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {reviewsData.summary.totalReviews} review
                  {reviewsData.summary.totalReviews === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-sm font-semibold">Lifetime</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buyer access
                </p>
              </div>
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-sm font-semibold">
                  {formatDate(product.updated_at)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Updated</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4 border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="mt-1 text-2xl font-semibold tracking-normal">
                    {formatProductPrice(product)}
                  </p>
                </div>
                <Badge variant="outline">Secure checkout</Badge>
              </div>
              <ProductCta
                currency={product.currency}
                productId={product.id}
                priceCents={product.price_cents}
                isFree={product.is_free}
                hasPurchased={hasPurchased}
                productType={product.product_type}
                slug={product.slug}
                thumbnailUrl={product.thumbnail_url}
                title={product.title}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  Icon: Layers3Icon,
                  label: "Type",
                  value: productTypeLabels[product.product_type],
                },
                {
                  Icon: ShieldCheckIcon,
                  label: "License",
                  value: license,
                },
                {
                  Icon: Clock3Icon,
                  label: "Access",
                  value: product.is_free
                    ? "Free instant access."
                    : "Instant after checkout.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2 rounded-lg border bg-card p-3 text-sm shadow-sm"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <item.Icon aria-hidden="true" className="size-4" />
                  </div>
                  <div className="grid gap-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="line-clamp-2 leading-5 text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="scroll-reveal mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Product details</p>
          <h2 className="text-3xl font-semibold tracking-normal">
            Built for practical use, not just a download link.
          </h2>
          <div className="grid gap-4 text-sm leading-7 text-muted-foreground md:text-base">
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={`${paragraph}-${index}`}>{paragraph}</p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {techStack.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <SparklesIcon aria-hidden="true" className="size-5" />
              <h3 className="text-lg font-semibold tracking-normal">
                What you get
              </h3>
            </div>
            <div className="grid gap-3">
              {includedItems.map((item) => (
                <div key={item} className="flex gap-3">
                  <CheckCircle2Icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <p className="font-medium">Best for</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getAudience(product)}
              </p>
            </div>
            <Link
              href="/cart"
              className="group flex flex-col justify-between rounded-lg border bg-card p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-lg"
            >
              <div>
                <p className="font-medium">Ready to bundle?</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Add this product to cart and checkout with other resources in
                  one place.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
                Open cart
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <ProductReviews
        canReply={canReply}
        canReview={hasPurchased}
        isAuthenticated={viewer.isAuthenticated}
        productId={product.id}
        reviewsData={reviewsData}
        slug={product.slug}
      />
    </div>
  );
}
