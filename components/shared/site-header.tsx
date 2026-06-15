import Link from "next/link";
import { BookOpenIcon, GiftIcon, HeadphonesIcon, SparklesIcon } from "lucide-react";

import { AccountMenu, type AccountMenuUser } from "@/components/account/account-menu";
import { CartHeaderButton } from "@/components/cart/cart-header-button";
import { FavoritesHeaderButton } from "@/components/favorites/favorites-header-button";
import { DanCruShopLogo } from "@/components/shared/dancrushop-logo";
import { HeaderSearch } from "@/components/shared/header-search";
import { MobileNavSheet } from "@/components/shared/mobile-nav-sheet";
import { Button } from "@/components/ui/button";
import { getSupportMailto } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";

async function getViewerState() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims as
      | {
          email?: string;
          sub?: string;
          user_metadata?: {
            avatar_url?: string;
            full_name?: string;
            name?: string;
          };
        }
      | undefined;
    const userId = claims?.sub;
    const isAuthenticated = !error && Boolean(userId);

    if (!isAuthenticated || !userId) {
      return { isAuthenticated: false, isAdmin: false, user: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name, role")
      .eq("id", userId)
      .maybeSingle();
    const fallbackName =
      claims?.user_metadata?.full_name ||
      claims?.user_metadata?.name ||
      claims?.email?.split("@")[0] ||
      "Khách hàng";
    const user: AccountMenuUser = {
      avatarUrl: profile?.avatar_url ?? claims?.user_metadata?.avatar_url ?? null,
      email: claims?.email ?? null,
      name: profile?.full_name?.trim() || fallbackName,
    };

    return {
      isAuthenticated,
      isAdmin: profile?.role === "admin",
      user,
    };
  } catch {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }
}

export async function SiteHeader() {
  const { isAuthenticated, isAdmin, user } = await getViewerState();

  return (
    <>
      {/* Top utility bar — trust links, scrolls away above the sticky header. */}
      <div className="hidden border-b border-border/70 bg-muted/40 md:block">
        <div className="mx-auto flex h-9 w-full max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <SparklesIcon aria-hidden="true" className="size-3.5 text-primary" />
            Tài nguyên số chính hãng — giao ngay sau thanh toán
          </span>
          <nav className="flex items-center gap-5">
            <Link
              href="/support"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <BookOpenIcon aria-hidden="true" className="size-3.5" />
              Hướng dẫn mua hàng
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <GiftIcon aria-hidden="true" className="size-3.5" />
              Ưu đãi khách hàng
            </Link>
            <Link
              href={getSupportMailto("DanCruShop support")}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <HeadphonesIcon aria-hidden="true" className="size-3.5" />
              Liên hệ hỗ trợ
            </Link>
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
          <Link
            href="/"
            className="shrink-0 transition-colors hover:text-foreground/80"
            aria-label="DanCruShop home"
          >
            <DanCruShopLogo />
          </Link>

          <HeaderSearch className="hidden max-w-md flex-1 md:block" />

        <nav className="ml-auto hidden shrink-0 items-center gap-5 text-sm text-muted-foreground lg:flex">
          <Link href="/products" className="transition-colors hover:text-foreground">
            Sản phẩm
          </Link>
          <Link href="/#danh-muc" className="transition-colors hover:text-foreground">
            Danh mục
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Bài viết
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <FavoritesHeaderButton />
          <CartHeaderButton />
          {isAdmin ? (
            <Button
              className="hidden md:inline-flex"
              size="sm"
              variant="secondary"
              render={<Link href="/admin" />}
              nativeButton={false}
            >
              Quản trị
            </Button>
          ) : null}
          {isAuthenticated ? (
            <>
              {user ? <AccountMenu user={user} /> : null}
            </>
          ) : (
            <Button
              className="hidden md:inline-flex"
              size="sm"
              variant="outline"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Đăng nhập
            </Button>
          )}
          <MobileNavSheet
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
      </header>
    </>
  );
}
