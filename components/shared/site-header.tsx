import Link from "next/link";
import { PackageOpenIcon } from "lucide-react";

import { AccountMenu, type AccountMenuUser } from "@/components/account/account-menu";
import { CartHeaderButton } from "@/components/cart/cart-header-button";
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
      "Buyer";
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
    <header className="sticky top-0 z-50 border-b bg-background shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-normal transition-colors hover:text-muted-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg border bg-card text-foreground shadow-sm">
            <PackageOpenIcon aria-hidden="true" className="size-4" />
          </span>
          <span>DanCruShop</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/products" className="transition-colors hover:text-foreground">
            Products
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <CartHeaderButton />
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Button
                  size="sm"
                  render={<Link href="/admin" />}
                  nativeButton={false}
                >
                  Admin
                </Button>
              ) : null}
              {user ? <AccountMenu user={user} /> : null}
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
