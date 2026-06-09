import Link from "next/link";

import { DanCruShopLogo } from "@/components/shared/dancrushop-logo";
import { getSupportEmail, getSupportMailto, policyLinks } from "@/lib/site-config";

export function SiteFooter() {
  const supportEmail = getSupportEmail();

  return (
    <footer className="border-t bg-background/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="grid gap-2">
          <DanCruShopLogo
            className="gap-2"
            markClassName="size-4"
            markContainerClassName="size-7 rounded-md"
            wordmarkClassName="text-sm"
          />
          <p>© {new Date().getFullYear()} Tool, source code và tài nguyên số cho builder.</p>
          <Link
            href={getSupportMailto("DanCruShop support")}
            className="w-fit transition-colors hover:text-foreground"
          >
            {supportEmail}
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/products" className="transition-colors hover:text-foreground">
            Sản phẩm
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Bài viết
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Đăng nhập
          </Link>
          {policyLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
