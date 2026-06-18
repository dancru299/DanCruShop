"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CreditCardIcon,
  LandmarkIcon,
  PackageOpenIcon,
  ShoppingCartIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import {
  createCartCheckoutFromForm,
  type CartCheckoutState,
} from "@/actions/checkout.actions";
import { applyCouponToCart } from "@/actions/coupon.actions";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getCartCheckoutReadiness,
  getCartCheckoutWarning,
} from "@/lib/cart/checkout-readiness";
import { formatPrice, productTypeLabels } from "@/lib/products/display";
import { betaPolicies } from "@/lib/site-config";

type AppliedCoupon = {
  code: string;
  currency: string;
  discountCents: number;
  totalAfterCents: number;
  // Snapshot of the cart the coupon was validated against, so we can drop it
  // when the cart contents change (server re-validates on checkout anyway).
  productIds: string;
};

function getTotals(items: CartItem[]) {
  const totals = new Map<string, number>();

  items.forEach((item) => {
    if (item.isFree) {
      return;
    }

    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.priceCents);
  });

  return Array.from(totals.entries()).map(([currency, totalCents]) => ({
    currency,
    totalCents,
  }));
}

const initialCheckoutState: CartCheckoutState = {
  error: null,
};

export function CartPageClient() {
  const { clearCart, items, itemCount, removeItem } = useCart();
  const [checkoutState, checkoutAction, isPending] = useActionState(
    createCartCheckoutFromForm,
    initialCheckoutState
  );
  const totals = useMemo(() => getTotals(items), [items]);
  const checkoutReadiness = useMemo(
    () => getCartCheckoutReadiness(items),
    [items]
  );
  const checkoutWarning = useMemo(() => getCartCheckoutWarning(items), [items]);
  const productIds = useMemo(
    () => JSON.stringify(items.map((item) => item.id)),
    [items]
  );
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplying, startApplying] = useTransition();

  const singleCurrencyTotal = totals.length === 1 ? totals[0] : null;
  // Drop a stale coupon during render (no effect needed) when the cart changes.
  const effectiveCoupon =
    appliedCoupon && appliedCoupon.productIds === productIds
      ? appliedCoupon
      : null;

  function handleApplyCoupon() {
    const code = couponInput.trim();

    if (!code) {
      return;
    }

    setCouponError(null);
    startApplying(async () => {
      const result = await applyCouponToCart({
        code,
        productIds: items.map((item) => item.id),
      });

      if (!result.ok) {
        setAppliedCoupon(null);
        setCouponError(result.error);
        return;
      }

      setAppliedCoupon({
        code: result.code,
        currency: result.currency,
        discountCents: result.discountCents,
        productIds,
        totalAfterCents: result.totalAfterCents,
      });
    });
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 md:py-16">
        <EmptyState
          icon={ShoppingCartIcon}
          title="Your cart is empty"
          description="Pick products from the storefront and check out in one place."
          action={
            <Button render={<Link href="/products" />} nativeButton={false}>
              Browse products
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:py-14 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">DanCruShop cart</p>
          <h1 className="text-3xl font-semibold tracking-normal">Cart</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Review the resources you selected before starting checkout.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 border-b p-4 last:border-b-0 md:grid-cols-[96px_1fr_auto] md:items-center"
            >
              <Link
                href={`/products/${item.slug}`}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
              >
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={item.title}
                    className="absolute inset-0 size-full object-cover"
                    src={item.thumbnailUrl}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <PackageOpenIcon aria-hidden="true" className="size-5" />
                  </div>
                )}
              </Link>

              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {productTypeLabels[item.productType]}
                  </Badge>
                  <Badge variant="secondary">Instant delivery</Badge>
                </div>
                <Link
                  href={`/products/${item.slug}`}
                  className="text-lg font-semibold tracking-normal transition-colors hover:text-muted-foreground"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.isFree
                    ? "Free product"
                    : formatPrice(item.priceCents, item.currency)}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
              >
                <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-lg border bg-card p-5 text-card-foreground shadow-sm lg:sticky lg:top-24">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">
                Order summary
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {itemCount} items selected
              </p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={clearCart}>
              Clear all
            </Button>
          </div>

          <div className="grid gap-3 border-y py-4">
            {totals.length > 0 ? (
              totals.map((total) => (
                <div
                  key={total.currency}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">
                    Total ({total.currency.toUpperCase()})
                  </span>
                  <span className="font-semibold">
                    {formatPrice(total.totalCents, total.currency)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">Free</span>
              </div>
            )}
          </div>

          {singleCurrencyTotal ? (
            <div className="grid gap-3">
              {effectiveCoupon ? (
                <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <TagIcon aria-hidden="true" className="size-4" />
                      {effectiveCoupon.code}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveCoupon}
                    >
                      <XIcon aria-hidden="true" data-icon="inline-start" />
                      Remove
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      -
                      {formatPrice(
                        effectiveCoupon.discountCents,
                        effectiveCoupon.currency
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total after discount</span>
                    <span className="font-semibold">
                      {formatPrice(
                        effectiveCoupon.totalAfterCents,
                        effectiveCoupon.currency
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(event) =>
                        setCouponInput(event.target.value.toUpperCase())
                      }
                      placeholder="Discount code"
                      disabled={isApplying}
                      className="uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={isApplying || !couponInput.trim()}
                    >
                      {isApplying ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                  {couponError ? (
                    <p className="text-sm text-destructive">{couponError}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-lg border bg-background/50 p-3">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <CreditCardIcon aria-hidden="true" className="size-4" />
              </span>
              <div className="grid gap-1">
                <p className="text-sm font-medium">Payment & delivery</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {betaPolicies.delivery}
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CreditCardIcon aria-hidden="true" className="size-4" />
                <span>Lemon Squeezy unlocks automatically after payment.</span>
              </div>
              <div className="flex items-center gap-2">
                <LandmarkIcon aria-hidden="true" className="size-4" />
                <span>
                  VietQR applies to VND orders
                  {checkoutReadiness.canUseVietQr ? " in this cart." : "."}
                </span>
              </div>
            </div>
          </div>

          {checkoutWarning ? (
            <p className="flex gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
              <AlertCircleIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              {checkoutWarning}
            </p>
          ) : null}

          {checkoutState.error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-6 text-destructive">
              {checkoutState.error}
            </p>
          ) : null}

          <form action={checkoutAction} className="grid gap-3">
            <input name="productIds" type="hidden" value={productIds} />
            <input
              name="coupon"
              type="hidden"
              value={effectiveCoupon?.code ?? ""}
            />
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Preparing checkout..." : "Check out everything"}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
            <p className="text-sm leading-6 text-muted-foreground">
              Free products open in your dashboard. Paid products go through the
              configured payment flow.
            </p>
          </form>
        </div>
      </aside>
    </div>
  );
}
