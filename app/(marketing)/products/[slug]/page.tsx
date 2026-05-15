/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";

import { ProductCta } from "@/components/products/product-cta";
import { ProductArtwork } from "@/components/products/product-card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  getProductBySlug,
  type ProductDetail,
} from "@/lib/supabase/queries/products";
import { checkUserAccess } from "@/lib/supabase/queries/purchases";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

const productTypeLabels: Record<ProductDetail["product_type"], string> = {
  bundle: "Bundle",
  course: "Course",
  digital_download: "Digital Download",
  free_resource: "Free Resource",
  template: "Template",
  tool: "Tool",
};

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

async function getCurrentUserId() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return user?.id ?? null;
  } catch {
    return null;
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

  const userId = await getCurrentUserId();
  const hasPurchased = userId
    ? await checkUserAccess(userId, product.id)
    : false;
  const techStack = getTechStack(product);
  const license = getLicense(product);

  return (
    <div className="bg-background">
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:py-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border bg-muted shadow-sm">
              {product.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <ProductArtwork product={product} />
              )}
            </div>

            {product.demo_url ? (
              <Link
                href={product.demo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View Live Demo
                <ExternalLinkIcon aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
          </div>

          <aside className="flex flex-col gap-6 lg:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {productTypeLabels[product.product_type]}
              </Badge>
              {product.is_free ? <Badge variant="outline">Free</Badge> : null}
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-semibold leading-tight tracking-normal text-balance md:text-5xl">
                {product.title}
              </h1>
              {product.short_description ? (
                <p className="text-base leading-8 text-muted-foreground md:text-lg">
                  {product.short_description}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <ProductCta
                currency={product.currency}
                productId={product.id}
                priceCents={product.price_cents}
                isFree={product.is_free}
                hasPurchased={hasPurchased}
              />
            </div>

            <div className="grid gap-4 rounded-lg border bg-card p-5 text-sm text-card-foreground shadow-sm">
              <div className="flex flex-col gap-2">
                <p className="font-medium">Tech stack</p>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium">License</p>
                <p className="mt-2 leading-6 text-muted-foreground">
                  {license}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
        <div className="prose max-w-none rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold tracking-normal">
            Product details
          </h2>
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground md:text-base">
            {product.description ??
              "More product details will be added here soon."}
          </p>
        </div>
      </section>
    </div>
  );
}
