"use client";

import Link from "next/link";
import { useActionState, useMemo } from "react";
import {
  ArrowRightIcon,
  PackageOpenIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from "lucide-react";

import {
  createCartCheckoutFromForm,
  type CartCheckoutState,
} from "@/actions/checkout.actions";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, productTypeLabels } from "@/lib/products/display";

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
  const productIds = useMemo(
    () => JSON.stringify(items.map((item) => item.id)),
    [items]
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 md:py-16">
        <div className="flex min-h-96 flex-col items-center justify-center gap-5 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <ShoppingCartIcon aria-hidden="true" className="size-6" />
          </div>
          <div className="flex max-w-md flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">
              Giỏ hàng đang trống
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Chọn sản phẩm từ storefront rồi thanh toán gọn ở một nơi.
            </p>
          </div>
          <Button render={<Link href="/products" />} nativeButton={false}>
            Xem sản phẩm
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:py-14 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Giỏ hàng DanCruShop</p>
          <h1 className="text-3xl font-semibold tracking-normal">Giỏ hàng</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Xem lại các tài nguyên đã chọn trước khi bắt đầu thanh toán.
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
                  <Badge variant="secondary">Giao ngay</Badge>
                </div>
                <Link
                  href={`/products/${item.slug}`}
                  className="text-lg font-semibold tracking-normal transition-colors hover:text-muted-foreground"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.isFree
                    ? "Sản phẩm miễn phí"
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
                Xóa
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
                Tóm tắt đơn hàng
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {itemCount} sản phẩm đã chọn
              </p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={clearCart}>
              Xóa hết
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
                    Tổng ({total.currency.toUpperCase()})
                  </span>
                  <span className="font-semibold">
                    {formatPrice(total.totalCents, total.currency)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Tổng</span>
                <span className="font-semibold">Miễn phí</span>
              </div>
            )}
          </div>

          {checkoutState.error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-6 text-destructive">
              {checkoutState.error}
            </p>
          ) : null}

          <form action={checkoutAction} className="grid gap-3">
            <input name="productIds" type="hidden" value={productIds} />
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Đang chuẩn bị checkout..." : "Thanh toán toàn bộ"}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
            <p className="text-sm leading-6 text-muted-foreground">
              Sản phẩm miễn phí sẽ mở trong dashboard. Sản phẩm trả phí sẽ đi
              qua flow thanh toán đã cấu hình.
            </p>
          </form>
        </div>
      </aside>
    </div>
  );
}
