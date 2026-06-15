/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRightIcon, GiftIcon, ShieldCheckIcon } from "lucide-react";

import { DanCruShopLogo } from "@/components/shared/dancrushop-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  getSupportEmail,
  getSupportMailto,
  policyLinks,
} from "@/lib/site-config";
import { getStoreSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const productLinks = [
  { label: "Tất cả sản phẩm", href: "/products" },
  { label: "Danh mục", href: "/#danh-muc" },
  { label: "Bài viết", href: "/blog" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-normal">{title}</h3>
      <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <Link
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const supportEmail = getSupportEmail();
  const { socials } = await getStoreSettings();

  return (
    <footer className="border-t border-border/80 bg-muted/30">
      {/* CTA band */}
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-10 text-center text-primary-foreground shadow-lg md:px-12 md:py-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
            Sẵn sàng bắt đầu chưa?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-primary-foreground/90 md:text-base">
            Gia nhập cộng đồng khách hàng hài lòng và trải nghiệm kho sản phẩm số
            đa dạng ngay hôm nay.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-transparent bg-white text-primary shadow-sm hover:bg-white/90 hover:text-primary"
              )}
            >
              Khám phá ngay
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              Xem ưu đãi
              <GiftIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="border-t border-border/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <DanCruShopLogo />
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Nền tảng bán tool, source code và tài nguyên số uy tín — giao ngay
              sau thanh toán.
            </p>
            {socials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {socials.map((social, index) => (
                  <Link
                    key={`${social.url}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/40"
                  >
                    <img
                      src={social.iconUrl}
                      alt={social.label}
                      className="size-5 object-contain"
                    />
                  </Link>
                ))}
              </div>
            ) : null}
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheckIcon
                aria-hidden="true"
                className="size-3.5 text-emerald-500"
              />
              Giao dịch an toàn
            </span>
          </div>

          <FooterColumn title="Sản phẩm" links={productLinks} />

          <FooterColumn
            title="Thông tin"
            links={[
              {
                label: "Liên hệ hỗ trợ",
                href: getSupportMailto("DanCruShop support"),
              },
              ...policyLinks,
            ]}
          />

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-normal">Cộng đồng</h3>
            {socials.length > 0 ? (
              <>
                <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                  {socials.map((social, index) => (
                    <li key={`${social.url}-${index}`}>
                      <Link
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 transition-colors hover:text-foreground"
                      >
                        <img
                          src={social.iconUrl}
                          alt=""
                          className="size-4 shrink-0 object-contain"
                        />
                        {social.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="text-xs leading-5 text-muted-foreground">
                  Có sản phẩm mới sẽ được đăng tại đây — tham gia để không bỏ lỡ.
                </p>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Thêm kênh cộng đồng (Telegram, Facebook...) trong{" "}
                <Link href="/admin/settings" className="hover:text-foreground">
                  /admin/settings
                </Link>
                .
              </p>
            )}
            <Link
              href={getSupportMailto("DanCruShop support")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {supportEmail}
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DanCruShop. Tool, source code và tài nguyên
          số cho builder.
        </div>
      </div>
    </footer>
  );
}
