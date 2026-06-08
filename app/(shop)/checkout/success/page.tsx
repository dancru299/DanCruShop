import Link from "next/link";
import {
  ArrowLeftIcon,
  GaugeIcon,
  LifeBuoyIcon,
  MailCheckIcon,
} from "lucide-react";

import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { betaPolicies, getSupportEmail, getSupportMailto } from "@/lib/site-config";

export default function CheckoutSuccessPage() {
  const supportEmail = getSupportEmail();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ClearCartOnMount />
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <MailCheckIcon aria-hidden="true" className="size-7" />
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-normal">
              Thanh toán thành công!
            </h1>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Vui lòng kiểm tra email của bạn để lấy Magic Link truy cập sản
              phẩm. Sau khi mở link, sản phẩm đã mua sẽ xuất hiện trong
              dashboard.
            </p>
          </div>

          <div className="grid w-full gap-3 text-left sm:grid-cols-3">
            <div className="rounded-lg border bg-background/50 p-3">
              <MailCheckIcon aria-hidden="true" className="mb-2 size-4" />
              <p className="text-sm font-medium">1. Kiểm tra email</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Magic link có thể mất vài phút trong giai đoạn beta.
              </p>
            </div>
            <div className="rounded-lg border bg-background/50 p-3">
              <GaugeIcon aria-hidden="true" className="mb-2 size-4" />
              <p className="text-sm font-medium">2. Mở dashboard</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Tài nguyên đã mua sẽ nằm trong khu vực dashboard.
              </p>
            </div>
            <div className="rounded-lg border bg-background/50 p-3">
              <LifeBuoyIcon aria-hidden="true" className="mb-2 size-4" />
              <p className="text-sm font-medium">3. Cần hỗ trợ?</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {betaPolicies.support}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              render={<Link href="/products" />}
              nativeButton={false}
            >
              <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
              Xem sản phẩm khác
            </Button>
            <Button render={<Link href="/login" />} nativeButton={false}>
              Mở trang đăng nhập
            </Button>
            <Button
              variant="secondary"
              render={<Link href={getSupportMailto("Checkout support")} />}
              nativeButton={false}
            >
              {supportEmail}
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
