import Link from "next/link";
import { ArrowRightIcon, ZapIcon } from "lucide-react";

import { FlashSaleCountdown } from "@/components/home/flash-sale-countdown";
import { ProductCard } from "@/components/products/product-card";
import { getDiscountedProducts } from "@/lib/supabase/queries/products";
import type { FlashSaleSection as FlashSaleConfig } from "@/lib/store/home-layout";

export async function FlashSaleSection({
  section,
}: {
  section: FlashSaleConfig;
}) {
  const endsAtMs = new Date(section.endsAt).getTime();

  // Hide once the sale window has passed. This is a server component rendered
  // per request, so reading the request-time clock here is intentional.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  if (!Number.isNaN(endsAtMs) && endsAtMs <= now) {
    return null;
  }

  const products = await getDiscountedProducts(section.limit);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-24 border-b border-border/80 bg-gradient-to-b from-orange-500/10 via-rose-500/5 to-transparent py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold uppercase tracking-tight text-rose-600 dark:text-rose-400">
              <ZapIcon aria-hidden="true" className="size-6 fill-current" />
              {section.title}
            </h2>
            <FlashSaleCountdown endsAt={section.endsAt} />
          </div>

          {section.actionLabel ? (
            <Link
              href={section.actionHref || "/products"}
              className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-400"
            >
              {section.actionLabel}
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
