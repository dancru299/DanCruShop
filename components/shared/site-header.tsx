import Link from "next/link";
import { PackageOpenIcon } from "lucide-react";

import { AccountMenu, type AccountMenuUser } from "@/components/account/account-menu";
import { CartHeaderButton } from "@/components/cart/cart-header-button";
import { MobileNavSheet } from "@/components/shared/mobile-nav-sheet";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-base font-semibold tracking-normal transition-colors hover:text-foreground/80"
        >
          <span className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-sm shadow-black/10">
            <PackageOpenIcon aria-hidden="true" className="size-4" />
          </span>
          <span>DanCruShop</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
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
  );
}
