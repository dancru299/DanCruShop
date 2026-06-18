/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { DownloadButton } from "@/components/products/download-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productTypeLabels } from "@/lib/products/display";
import type { UserPurchase } from "@/lib/supabase/queries/purchases";

type PurchasedProductCardProps = {
  purchase: UserPurchase;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
});

export function PurchasedProductCard({ purchase }: PurchasedProductCardProps) {
  const { product } = purchase;
  const thumbnailSrc = product.thumbnail_url ?? "/window.svg";

  return (
    <article className="grid overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm md:grid-cols-[14rem_1fr]">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[16/10] overflow-hidden bg-muted md:aspect-auto"
      >
        <img
          src={thumbnailSrc}
          alt={product.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {productTypeLabels[product.product_type]}
            </Badge>
            {product.is_free ? <Badge variant="outline">Free</Badge> : null}
          </div>
          <div className="flex flex-col gap-1">
            <Link
              href={`/products/${product.slug}`}
              className="text-lg font-semibold tracking-normal transition-colors hover:text-muted-foreground"
            >
              {product.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              Purchased {dateFormatter.format(new Date(purchase.purchased_at))}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Button
            variant="default"
            render={<Link href={`/products/${product.slug}`} />}
            nativeButton={false}
          >
            View details
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
          <DownloadButton productId={product.id} />
        </div>
      </div>
    </article>
  );
}
