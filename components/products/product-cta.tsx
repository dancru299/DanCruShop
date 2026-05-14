import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  claimFreeProduct,
  createLemonSqueezyCheckout,
  createVietQrOrder,
} from "@/actions/checkout.actions";

type ProductCtaProps = {
  currency: string;
  productId: string;
  priceCents: number;
  isFree: boolean;
  hasPurchased: boolean;
};

function formatPrice(priceCents: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase() || "USD";
  const amount =
    normalizedCurrency === "VND" ? priceCents : priceCents / 100;

  return new Intl.NumberFormat(
    normalizedCurrency === "VND" ? "vi-VN" : "en-US",
    {
      currency: normalizedCurrency,
      maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 2,
      style: "currency",
    }
  ).format(amount);
}

export function ProductCta({
  currency,
  productId,
  priceCents,
  isFree,
  hasPurchased,
}: ProductCtaProps) {
  const normalizedCurrency = currency.trim().toUpperCase() || "USD";
  const supportsVietQr = normalizedCurrency === "VND";

  if (hasPurchased) {
    return (
      <Button
        size="lg"
        className="w-full"
        render={<Link href={`/dashboard/products/${productId}`} />}
        nativeButton={false}
      >
        Go to Dashboard
      </Button>
    );
  }

  if (isFree) {
    return (
      <form action={claimFreeProduct.bind(null, productId)}>
        <Button size="lg" type="submit" className="w-full">
          Get it for Free
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={createLemonSqueezyCheckout.bind(null, productId)}>
        <Button size="lg" type="submit" className="w-full">
          Buy Now - {formatPrice(priceCents, normalizedCurrency)}
        </Button>
      </form>

      {supportsVietQr ? (
        <form action={createVietQrOrder.bind(null, productId)}>
          <Button
            size="lg"
            type="submit"
            className="w-full"
            variant="outline"
          >
            Chuyển khoản VietQR
          </Button>
        </form>
      ) : null}
    </div>
  );
}
