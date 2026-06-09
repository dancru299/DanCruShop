/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ExternalLinkIcon,
  LifeBuoyIcon,
  Layers3Icon,
  MonitorCheckIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  type LucideIcon,
} from "lucide-react";

import { ProductViewTracker } from "@/components/analytics/product-view-tracker";
import { ProductCta } from "@/components/products/product-cta";
import {
  ProductArtwork,
  ProductCard,
} from "@/components/products/product-card";
import { ProductReviews } from "@/components/products/product-reviews";
import { Badge } from "@/components/ui/badge";
import {
  formatProductPrice,
  productTypeDescriptions,
  productTypeLabels,
} from "@/lib/products/display";
import {
  getProductCompatibility,
  getProductIncludedItems,
  getProductRequirements,
  getProductSupportNote,
  getProductUpdatePolicy,
} from "@/lib/products/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo";
import {
  betaPolicies,
  getSupportEmail,
  getSupportMailto,
  siteName,
} from "@/lib/site-config";
import { getBundleChildProducts } from "@/lib/supabase/queries/bundles";
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
    "Dùng cho dự án cá nhân hoặc thương mại của riêng bạn."
  );
}

function getAudience(product: ProductDetail) {
  return (
    getStringFromMetadata(product.metadata, "audience") ??
    "Builder, maker và developer đang ship sản phẩm thực dụng."
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
    product.is_free ? "Miễn phí" : null,
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
  return new Intl.DateTimeFormat("vi-VN", {
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
      title: "Không tìm thấy sản phẩm",
    };
  }

  const description =
    product.short_description ??
    product.description?.slice(0, 200) ??
    `Khám phá ${product.title} trên ${siteName}.`;
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
  const [hasPurchased, reviewsData, bundleChildren] = await Promise.all([
    viewer.userId ? checkUserAccess(viewer.userId, product.id) : false,
    getProductReviews(product.id),
    product.product_type === "bundle"
      ? getBundleChildProducts(product.id)
      : Promise.resolve([]),
  ]);
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

  const productJsonLd = buildProductJsonLd({
    category: categoryLabels[0],
    currency: product.currency,
    description:
      product.short_description ??
      product.description?.slice(0, 200) ??
      `Khám phá ${product.title} trên ${siteName}.`,
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
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/products" },
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

            <div className="flex flex-wrap items-center gap-3">
              {product.demo_url ? (
                <Link
                  href={product.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Xem demo
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
                  Xem preview
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
              <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-2.5">
                <div className="flex items-center gap-1 text-amber-400">
                  <StarIcon aria-hidden="true" className="size-4 fill-current" />
                  <span className="text-sm font-semibold text-foreground">
                    {reviewsData.summary.totalReviews > 0
                      ? reviewsData.summary.averageRating.toFixed(1)
                      : "Mới"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reviewsData.summary.totalReviews} đánh giá
                </p>
              </div>
              <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-2.5">
                <p className="text-sm font-semibold">Truy cập lâu dài</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Trong dashboard đã mua
                </p>
              </div>
              <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-2.5">
                <p className="text-sm font-semibold">
                  {formatDate(product.updated_at)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Cập nhật</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-4 text-card-foreground shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4 border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Giá</p>
                  <p className="mt-1 text-2xl font-semibold tracking-normal">
                    {formatProductPrice(product)}
                  </p>
                </div>
                <Badge variant="outline">Thanh toán an toàn</Badge>
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
              <div className="mt-4 grid gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
                <p>{betaPolicies.delivery}</p>
                <p>{betaPolicies.refund}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  Icon: Layers3Icon,
                  label: "Loại",
                  value: productTypeLabels[product.product_type],
                },
                {
                  Icon: ShieldCheckIcon,
                  label: "Bản quyền",
                  value: license,
                },
                {
                  Icon: Clock3Icon,
                  label: "Truy cập",
                  value: product.is_free
                    ? "Miễn phí, mở ngay."
                    : "Mở ngay sau thanh toán.",
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
              <p className="text-sm text-muted-foreground">Bundle gồm</p>
              <h2 className="text-3xl font-semibold tracking-normal">
                {bundleChildren.length} sản phẩm được mở khoá khi mua bundle
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Thanh toán một lần, toàn bộ sản phẩm dưới đây sẽ xuất hiện trong
                dashboard đã mua của bạn.
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
          <p className="text-sm text-muted-foreground">Chi tiết sản phẩm</p>
          <h2 className="text-3xl font-semibold tracking-normal">
            Dùng được ngay cho dự án thật, không chỉ là một file tải về.
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
          <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-5 text-card-foreground shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <SparklesIcon aria-hidden="true" className="size-5" />
              <h3 className="text-lg font-semibold tracking-normal">
                Bạn nhận được gì
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
                Trước khi mua
              </h3>
            </div>
            <div className="grid gap-3">
              <BeforeBuyingRow
                Icon={MonitorCheckIcon}
                title="Yêu cầu sử dụng"
                description={requirements.join(" ")}
              />
              <BeforeBuyingRow
                Icon={Layers3Icon}
                title="Compatibility"
                description={compatibility}
              />
              <BeforeBuyingRow
                Icon={RotateCcwIcon}
                title="Cập nhật và truy cập"
                description={updatePolicy}
              />
              <BeforeBuyingRow
                Icon={LifeBuoyIcon}
                title="Support và hoàn tiền"
                description={`${supportNote} ${betaPolicies.refund}`}
                href={getSupportMailto(`Support ${product.title}`)}
                linkLabel={supportEmail}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card/60 backdrop-blur-xl p-5 shadow-sm">
              <p className="font-medium">Phù hợp với</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getAudience(product)}
              </p>
            </div>
            <Link
              href="/cart"
              className="group flex flex-col justify-between rounded-lg border bg-card/60 backdrop-blur-xl p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-lg"
            >
              <div>
                <p className="font-medium">Mua kèm trong giỏ hàng?</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Thêm sản phẩm này vào giỏ và checkout cùng các tài nguyên khác
                  ở một nơi.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
                Mở giỏ hàng
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
