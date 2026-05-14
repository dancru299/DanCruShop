/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, ClockIcon } from "lucide-react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUserVietQrOrder } from "@/lib/supabase/queries/orders";
import { createClient } from "@/lib/supabase/server";

type VietQrOrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

function getVietQrConfig() {
  const bankBin = process.env.VIETQR_BANK_BIN?.trim();
  const accountNo = process.env.VIETQR_ACCOUNT_NO?.trim();
  const template = process.env.VIETQR_TEMPLATE?.trim() || "compact2";

  return {
    accountNo,
    bankBin,
    isConfigured: Boolean(bankBin && accountNo),
    template,
  };
}

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

  const config = getVietQrConfig();
  const orderCode = order.provider_order_id ?? order.id;
  const transferAmount = order.currency === "VND" ? order.total_cents : 0;
  const qrUrl =
    config.isConfigured && transferAmount > 0
      ? createQrUrl(
          config.bankBin ?? "",
          config.accountNo ?? "",
          config.template,
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
          Quay lại cửa hàng
        </Button>

        <section className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-5 text-center text-card-foreground shadow-sm">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`VietQR cho đơn ${orderCode}`}
                className="aspect-square w-full rounded-lg border bg-background object-contain"
              />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border bg-muted p-6 text-muted-foreground">
                <ClockIcon aria-hidden="true" />
                <p className="text-sm leading-6">
                  QR chưa được cấu hình. Vui lòng dùng thông tin chuyển khoản
                  thủ công bên cạnh.
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
                  Mã đơn hàng: {orderCode}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-normal">
                Chuyển khoản VietQR
              </h1>
              <p className="text-sm leading-7 text-muted-foreground md:text-base">
                Vui lòng chuyển khoản với nội dung là Mã Đơn Hàng. Quản trị
                viên sẽ duyệt và gửi email cho bạn trong vòng 24h.
              </p>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <span className="text-muted-foreground">Số tiền</span>
                <span className="font-semibold">
                  {formatAmount(order.total_cents, order.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <span className="text-muted-foreground">Nội dung</span>
                <span className="font-semibold">{orderCode}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold">{order.email}</span>
              </div>
              {config.bankBin ? (
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Ngân hàng</span>
                  <span className="font-semibold">{config.bankBin}</span>
                </div>
              ) : null}
              {config.accountNo ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Số tài khoản</span>
                  <span className="font-semibold">{config.accountNo}</span>
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
