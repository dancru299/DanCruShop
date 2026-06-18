import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, GitCompareIcon } from "lucide-react";

import { CompareMatrix } from "@/components/compare/compare-matrix";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getCompareProducts } from "@/lib/supabase/queries/compare";

export const metadata: Metadata = {
  title: "Compare products",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ComparePageProps = {
  searchParams: Promise<{ items?: string }>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { items } = await searchParams;
  const slugs = (items ?? "")
    .split(",")
    .map((slug) => {
      try {
        return decodeURIComponent(slug).trim();
      } catch {
        return slug.trim();
      }
    })
    .filter(Boolean);

  const products = await getCompareProducts(slugs);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/products"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Continue browsing products
        </Link>
        <div className="flex items-center gap-3">
          <GitCompareIcon aria-hidden="true" className="size-6" />
          <h1 className="text-3xl font-semibold tracking-normal">
            Technical comparison
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Compare the tech stack, integrations, and licensing across products to
          pick the right starter kit for your project.
        </p>
      </div>

      {products.length >= 2 ? (
        <CompareMatrix products={products} />
      ) : (
        <EmptyState
          icon={GitCompareIcon}
          title="You need at least 2 products to compare"
          description="Tap the compare button on a product card to add it to your list, then come back here."
          action={
            <Link
              href="/products"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Explore products
            </Link>
          }
        />
      )}
    </div>
  );
}
