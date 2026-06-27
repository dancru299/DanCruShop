/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2Icon,
  Clock3Icon,
  LifeBuoyIcon,
  Layers3Icon,
  MonitorCheckIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  type LucideIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { ProductViewTracker } from "@/components/analytics/product-view-tracker";
import {
  ProductBuyBox,
  type BuyBoxOption,
} from "@/components/products/product-buy-box";
import {
  ProductArtwork,
  ProductCard,
} from "@/components/products/product-card";
import { ProductReviews } from "@/components/products/product-reviews";
import { Badge } from "@/components/ui/badge";
import {
  productTypeDescriptions,
  productTypeLabels,
} from "@/lib/products/display";
import {
  getProductCompatibility,
  getProductGithubRepo,
  getProductIncludedItems,
  getProductRequirements,
  getProductSupportNote,
  getProductUpdatePolicy,
} from "@/lib/products/metadata";
import { getProductChangelog } from "@/lib/github/changelog";
import { getProductTechSlugs, techLabel } from "@/lib/products/specs";
import { ProductInfoTabs } from "@/components/products/product-info-tabs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo";
import {
  betaPolicies,
  getSupportEmail,
  getSupportMailto,
  siteName,
} from "@/lib/site-config";
import { getBundleChildProducts } from "@/lib/supabase/queries/bundles";
import { getPublishedVariants } from "@/lib/supabase/queries/product-variants";
import {
  checkUserAccess,
  getPurchasedVariantIds,
} from "@/lib/supabase/queries/purchases";
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
  const slugs = getProductTechSlugs(product.metadata);

  if (slugs.length > 0) {
    return slugs.map((slug) => techLabel(slug, "en"));
  }

  return ["Next.js", "Supabase", "Tailwind CSS"];
}

function getLicense(product: ProductDetail) {
  return (
    getStringFromMetadata(product.metadata, "license") ??
    "Use it for your own personal or commercial projects."
  );
}

function getAudience(product: ProductDetail) {
  return (
    getStringFromMetadata(product.metadata, "audience") ??
    "Builders, makers, and developers shipping practical products."
  );
}

function getIncludedItems(product: ProductDetail) {
  return getProductIncludedItems(product);
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

  const description =
    product.short_description ??
    product.description?.slice(0, 200) ??
    `Explore ${product.title} on ${siteName}.`;
  const path = `/products/${product.slug}`;

  return {
    title: product.title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      url: path,
      title: product.title,
      description,
      images: product.thumbnail_url ? [product.thumbnail_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
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
  const githubRepo = getProductGithubRepo(product.metadata);
  const [
    hasPurchased,
    purchasedVariantIds,
    reviewsData,
    bundleChildren,
    changelog,
    variants,
  ] = await Promise.all([
    viewer.userId ? checkUserAccess(viewer.userId, product.id) : false,
    viewer.userId
      ? getPurchasedVariantIds(viewer.userId, product.id)
      : Promise.resolve<string[]>([]),
    getProductReviews(product.id),
    product.product_type === "bundle"
      ? getBundleChildProducts(product.id)
      : Promise.resolve([]),
    githubRepo ? getProductChangelog(githubRepo) : Promise.resolve([]),
    getPublishedVariants(product.id),
  ]);

  // Each variant of the product is a selectable, purchasable version on the same
  // page. id = variant id (the purchasable identity); productId is the product.
  const buyBoxOptions: BuyBoxOption[] =
    variants.length > 0
      ? variants.map((variant) => ({
          id: variant.id,
          productId: product.id,
          title: product.title,
          slug: product.slug,
          productType: product.product_type,
          optionLabel: variant.name,
          priceCents: variant.price_cents,
          compareAtPriceCents: variant.compare_at_price_cents,
          currency: product.currency,
          isFree: variant.is_free,
        }))
      : [
          {
            id: product.id,
            productId: product.id,
            title: product.title,
            slug: product.slug,
            productType: product.product_type,
            optionLabel: null,
            priceCents: product.price_cents,
            compareAtPriceCents: product.compare_at_price_cents,
            currency: product.currency,
            isFree: product.is_free,
          },
        ];
  const lemonSqueezyUrl =
    getStringFromMetadata(product.metadata, "lemonSqueezyUrl") ??
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_URL?.trim() ??
    null;
  const techStack = getTechStack(product);
  const license = getLicense(product);
  const includedItems = getIncludedItems(product);
  const requirements = getProductRequirements(product);
  const compatibility = getProductCompatibility(product);
  const updatePolicy = getProductUpdatePolicy(product);
  const supportNote = getProductSupportNote(product);
  const supportEmail = getSupportEmail();
  const categoryLabels = getCategoryLabels(product);
  const productTags = getProductTags(product, categoryLabels);
  const descriptionParagraphs = getDescriptionParagraphs(product);
  const canReply = hasPurchased || viewer.isAdmin;
  const overviewContent = product.description ? (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
      <ReactMarkdown>{product.description}</ReactMarkdown>
    </div>
  ) : (
    <div className="grid gap-4 text-sm leading-7 text-muted-foreground md:text-base">
      {descriptionParagraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{paragraph}</p>
      ))}
    </div>
  );

  const productJsonLd = buildProductJsonLd({
    category: categoryLabels[0],
    currency: product.currency,
    description:
      product.short_description ??
      product.description?.slice(0, 200) ??
      `Explore ${product.title} on ${siteName}.`,
    image: product.thumbnail_url,
    isFree: product.is_free,
    name: product.title,
    priceCents: product.price_cents,
    rating:
      reviewsData.summary.totalReviews > 0
        ? {
            count: reviewsData.summary.totalReviews,
            value: reviewsData.summary.averageRating,
          }
        : null,
    slug: product.slug,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: product.title, path: `/products/${product.slug}` },
  ]);

  return (
    <div>
      <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />
      <ProductViewTracker productId={product.id} slug={product.slug} />
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 pb-10 pt-8 md:pb-14 md:pt-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
          <div className="motion-fade-up flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-lg border bg-card/60 backdrop-blur-xl p-3 shadow-2xl shadow-foreground/5">
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
              <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-2.5">
                <div className="flex items-center gap-1 text-amber-400">
                  <StarIcon aria-hidden="true" className="size-4 fill-current" />
                  <span className="text-sm font-semibold text-foreground">
                    {reviewsData.summary.totalReviews > 0
                      ? reviewsData.summary.averageRating.toFixed(1)
                      : "New"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reviewsData.summary.totalReviews > 0
                    ? `${reviewsData.summary.totalReviews} reviews`
                    : "Be the first to review"}
                </p>
              </div>
              <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-2.5">
                <p className="text-sm font-semibold">Long-term access</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  In your purchased dashboard
                </p>
              </div>
              <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-2.5">
                <p className="text-sm font-semibold">
                  {formatDate(product.updated_at)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Updated</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-4 text-card-foreground shadow-sm">
              <ProductBuyBox
                activeOptionId={
                  variants.find((variant) => variant.is_default)?.id ??
                  buyBoxOptions[0]?.id ??
                  product.id
                }
                demoUrl={product.demo_url}
                lemonSqueezyUrl={lemonSqueezyUrl}
                options={buyBoxOptions}
                previewUrl={product.preview_url}
                purchasedOptionIds={purchasedVariantIds}
                thumbnailUrl={product.thumbnail_url}
              />
              <div className="mt-4 grid gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
                <p>{betaPolicies.delivery}</p>
                <p>{betaPolicies.refund}</p>
              </div>
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
                    ? "Free, instant access."
                    : "Instant access after payment.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2 rounded-lg border bg-card/60 backdrop-blur-xl p-3 text-sm shadow-sm"
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

      {bundleChildren.length > 0 ? (
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
            <div className="mb-6 flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">This bundle includes</p>
              <h2 className="text-3xl font-semibold tracking-normal">
                {bundleChildren.length} products unlocked when you buy the bundle
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Pay once and every product below will appear in your purchased
                dashboard.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {bundleChildren.map((child) => (
                <ProductCard key={child.id} product={child} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="scroll-reveal mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-normal">Overview</h2>
          {githubRepo ? (
            <ProductInfoTabs overview={overviewContent} commits={changelog} />
          ) : (
            overviewContent
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {techStack.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-5 text-card-foreground shadow-sm">
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

          <div className="rounded-lg border bg-card/60 p-5 text-card-foreground shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheckIcon aria-hidden="true" className="size-5" />
              <h3 className="text-lg font-semibold tracking-normal">
                Before you buy
              </h3>
            </div>
            <div className="grid gap-3">
              <BeforeBuyingRow
                Icon={MonitorCheckIcon}
                title="Requirements"
                description={requirements.join(" ")}
              />
              <BeforeBuyingRow
                Icon={Layers3Icon}
                title="Compatibility"
                description={compatibility}
              />
              <BeforeBuyingRow
                Icon={RotateCcwIcon}
                title="Updates and access"
                description={updatePolicy}
              />
              <BeforeBuyingRow
                Icon={LifeBuoyIcon}
                title="Support and refunds"
                description={`${supportNote} ${betaPolicies.refund}`}
                href={getSupportMailto(`Support ${product.title}`)}
                linkLabel={supportEmail}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-5 shadow-sm">
            <p className="font-medium">Best for</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {getAudience(product)}
            </p>
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

function BeforeBuyingRow({
  description,
  href,
  Icon,
  linkLabel,
  title,
}: {
  description: string;
  href?: string;
  Icon: LucideIcon;
  linkLabel?: string;
  title: string;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border/70 bg-background/50 p-3 text-sm sm:grid-cols-[2rem_1fr]">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </div>
      <div className="grid gap-1">
        <p className="font-medium">{title}</p>
        <p className="leading-6 text-muted-foreground">{description}</p>
        {href && linkLabel ? (
          <Link
            href={href}
            className="w-fit text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
