/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, ClockIcon } from "lucide-react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStoreSettings, isVietQrConfigured } from "@/lib/store/settings";
import { getCurrentUserVietQrOrder } from "@/lib/supabase/queries/orders";
import { createClient } from "@/lib/supabase/server";

type VietQrOrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

function formatAmount(total: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase() || "VND";
  const amount = normalizedCurrency === "VND" ? total : total / 100;

  return new Intl.NumberFormat(
    normalizedCurrency === "VND" ? "vi-VN" : "en-US",
    {
      currency: normalizedCurrency,
      maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 2,
      style: "currency",
    }
  ).format(amount);
}

function createQrUrl(
  bankBin: string,
  accountNo: string,
  template: string,
  amount: number,
  orderCode: string
) {
  const url = new URL(
    `https://img.vietqr.io/image/${bankBin}-${accountNo}-${template}.png`
  );

  url.searchParams.set("amount", String(amount));
  url.searchParams.set("addInfo", orderCode);

  return url.toString();
}

export default async function VietQrOrderPage({ params }: VietQrOrderPageProps) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?next=${encodeURIComponent(`/vietqr/${orderId}`)}`);
  }

  const order = await getCurrentUserVietQrOrder(orderId);

  if (!order) {
    notFound();
  }

  const { vietqr } = await getStoreSettings();
  const isConfigured = isVietQrConfigured(vietqr);
  const orderCode = order.provider_order_id ?? order.id;
  const transferAmount = order.currency === "VND" ? order.total_cents : 0;
  const qrUrl =
    isConfigured && transferAmount > 0
      ? createQrUrl(
          vietqr.bankBin ?? "",
          vietqr.accountNo ?? "",
          vietqr.template,
          transferAmount,
          orderCode
        )
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 md:py-14">
        <Button
          className="w-fit"
          variant="ghost"
          render={<Link href="/products" />}
          nativeButton={false}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Back to store
        </Button>

        <section className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-5 text-center text-card-foreground shadow-sm">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`VietQR for order ${orderCode}`}
                className="aspect-square w-full rounded-lg border bg-background object-contain"
              />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border bg-muted p-6 text-muted-foreground">
                <ClockIcon aria-hidden="true" />
                <p className="text-sm leading-6">
                  QR is not configured yet. Please use the manual bank transfer
                  details on the right.
                </p>
              </div>
            )}

            <Badge variant="secondary">VietQR</Badge>
          </div>

          <div className="flex flex-col gap-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={order.status === "pending" ? "secondary" : "default"}
                >
                  {order.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Order code: {orderCode}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-normal">
                VietQR bank transfer
              </h1>
              <p className="text-sm leading-7 text-muted-foreground md:text-base">
                Please make the transfer using the order code as the note. An
                admin will approve it and email you within 24 hours.
              </p>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  {formatAmount(order.total_cents, order.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <span className="text-muted-foreground">Transfer note</span>
                <span className="font-semibold">{orderCode}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold">{order.email}</span>
              </div>
              {vietqr.bankBin ? (
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-semibold">{vietqr.bankBin}</span>
                </div>
              ) : null}
              {vietqr.accountNo ? (
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Account number</span>
                  <span className="font-semibold">{vietqr.accountNo}</span>
                </div>
              ) : null}
              {vietqr.accountName ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Account holder</span>
                  <span className="font-semibold">{vietqr.accountName}</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
