import Link from "next/link";
import { ArrowLeftIcon, MailCheckIcon } from "lucide-react";

import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ClearCartOnMount />
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="flex w-full max-w-xl flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
