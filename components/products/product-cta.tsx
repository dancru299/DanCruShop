import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import {
  claimFreeProduct,
  createLemonSqueezyCheckout,
  createVietQrOrder,
} from "@/actions/checkout.actions";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/products/display";
import type { ProductType } from "@/lib/supabase/queries/products";

type ProductCtaProps = {
  currency: string;
  hasPurchased: boolean;
  isFree: boolean;
  priceCents: number;
  productId: string;
  productType: ProductType;
  slug: string;
  thumbnailUrl: string | null;
  title: string;
};

export function ProductCta({
  currency,
  hasPurchased,
  isFree,
  priceCents,
  productId,
  productType,
  slug,
  thumbnailUrl,
  title,
}: ProductCtaProps) {
  const normalizedCurrency = currency.trim().toUpperCase() || "USD";
  const supportsVietQr = normalizedCurrency === "VND";
  const cartProduct = {
    currency,
    id: productId,
    isFree,
    priceCents,
    productType,
    slug,
    thumbnailUrl,
    title,
  };

  if (hasPurchased) {
    return (
      <Button
        size="lg"
        className="w-full"
        render={<Link href={`/dashboard/products/${productId}`} />}
        nativeButton={false}
      >
        Open dashboard
        <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
      </Button>
    );
  }

  if (isFree) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <form action={claimFreeProduct.bind(null, productId)}>
          <Button size="lg" type="submit" className="w-full">
            Get it free
          </Button>
        </form>
        <AddToCartButton product={cartProduct} size="lg" className="w-full">
          Add to cart
        </AddToCartButton>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <form action={createLemonSqueezyCheckout.bind(null, productId)}>
        <Button size="lg" type="submit" className="w-full">
          Buy now - {formatPrice(priceCents, normalizedCurrency)}
        </Button>
      </form>

      <AddToCartButton product={cartProduct} size="lg" className="w-full">
        Add to cart
      </AddToCartButton>

      {supportsVietQr ? (
        <form action={createVietQrOrder.bind(null, productId)}>
          <Button size="lg" type="submit" className="w-full" variant="outline">
            Pay with VietQR
          </Button>
        </form>
      ) : null}
    </div>
  );
}
