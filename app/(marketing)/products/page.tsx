import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpenIcon } from "lucide-react";

import { StackBuilder } from "@/components/products/stack-builder";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductPagination } from "@/components/products/product-pagination";
import { ProductSearchBar } from "@/components/products/product-search-bar";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import type { ProductType } from "@/lib/supabase/queries/products";
import { validateTechSlugs } from "@/lib/products/specs";
import { searchByStack, type StackMatchProduct } from "@/lib/products/stack-query";
import {
  getAllCategories,
  searchPublishedProducts,
} from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore all the tools, source code, and digital resources on DanCruShop.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Products | DanCruShop",
    description:
      "Explore all the tools, source code, and digital resources on DanCruShop.",
    url: "/products",
    type: "website",
  },
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
    page?: string;
    stack?: string;
  }>;
};

const upcomingProducts = [
  {
    title: "Full-stack starter",
    type: "Source code",
    description: "A sample codebase with auth, database, dashboard, and payment flow.",
    className: "from-emerald-500/25 via-cyan-500/10 to-background",
  },
  {
    title: "AI workflow notes",
    type: "Learning material",
    description:
      "Notes on shipping AI apps, agent workflows, and how to package a product.",
    className: "from-cyan-500/25 via-amber-500/10 to-background",
  },
  {
    title: "Mini tools for builders",
    type: "Mini tool",
    description:
      "Small tools for automation, productivity, and running your shop.",
    className: "from-rose-500/20 via-emerald-500/10 to-background",
  },
];

const knownTypes: ProductType[] = [
  "digital_download",
  "course",
  "tool",
  "template",
  "bundle",
  "free_resource",
];

function isValidProductType(value: string): value is ProductType {
  return knownTypes.includes(value as ProductType);
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q, category, type, page, stack } = await searchParams;

  const safeType = type && isValidProductType(type) ? type : undefined;
  const safePage = Math.max(1, Number(page) || 1);

  const rawStack = stack ?? "";
  const selectedStack = validateTechSlugs(
    rawStack ? rawStack.split(",") : []
  );
  const isStackMode = selectedStack.length > 0;

  const hasActiveFilters = Boolean(q || category || safeType || isStackMode);

  const [{ products, total, totalPages }, categories] = await Promise.all([
    isStackMode
      ? searchByStack({
          selectedTechs: selectedStack,
          page: safePage,
          perPage: 12,
        })
      : searchPublishedProducts({
          category,
          page: safePage,
          perPage: 12,
          query: q,
          type: safeType,
        }),
    getAllCategories(),
  ]);

  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 md:py-14">
          <p className="text-sm font-medium text-muted-foreground">
            DanCruShop
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
            Product catalog
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Browse all the source code, templates, tools, and digital resources
            on sale.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Suspense
              fallback={
                <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
              }
            >
              <ProductSearchBar />
            </Suspense>
            <Suspense
              fallback={
                <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
              }
            >
              <StackBuilder />
            </Suspense>
            {categories.length > 0 ? (
              <Suspense
                fallback={
                  <div className="h-7 w-full animate-pulse rounded-lg bg-muted" />
                }
              >
                <ProductFilters categories={categories} />
              </Suspense>
            ) : null}
          </div>

          {products.length > 0 ? (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const matchPercent = isStackMode
                    ? (product as StackMatchProduct).matchPercent
                    : undefined;

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      matchPercent={matchPercent}
                    />
                  );
                })}
              </div>
              <Suspense>
                <ProductPagination
                  page={safePage}
                  totalPages={totalPages}
                  total={total}
                />
              </Suspense>
            </div>
          ) : hasActiveFilters ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-lg border bg-card p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <PackageOpenIcon aria-hidden="true" />
              </div>
              <div className="flex max-w-md flex-col gap-2">
                <h2 className="text-xl font-semibold tracking-normal">
                  No products found
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Try a different keyword or clear the filters to see more products.
                </p>
              </div>
              <Button
                variant="outline"
                render={<Link href="/products" />}
                nativeButton={false}
              >
                View all products
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="flex flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex max-w-2xl gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                    <PackageOpenIcon aria-hidden="true" />
                  </div>
                  <div className="grid gap-2">
                    <h2 className="text-xl font-semibold tracking-normal">
                      Products are being prepared
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Once products are published, the real list will appear
                      here. While we wait for live data, these are the content
                      shelves the storefront is designed to serve.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-fit"
                  variant="outline"
                  render={<Link href="/blog" />}
                  nativeButton={false}
                >
                  Read the blog
                </Button>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {upcomingProducts.map((item) => (
                  <div
                    key={item.title}
                    className="flex min-h-72 flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
                  >
                    <div
                      className={`relative aspect-[16/10] bg-gradient-to-br ${item.className}`}
                    >
                      <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                          {item.type}
                        </span>
                        <PackageOpenIcon
                          aria-hidden="true"
                          className="size-5 text-foreground/60"
                        />
                      </div>
                      <div className="absolute bottom-5 left-5 right-5 grid gap-2">
                        <div className="h-2 w-24 rounded-full bg-foreground/70" />
                        <div className="h-2 w-36 rounded-full bg-foreground/25" />
                        <div className="h-2 w-20 rounded-full bg-foreground/20" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="text-base font-semibold leading-6 tracking-normal">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-auto border-t pt-4 text-sm font-medium text-muted-foreground">
                        Preparing to publish
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
