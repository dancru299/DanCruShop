import Link from "next/link";
import { LogOutIcon, PackageOpenIcon } from "lucide-react";

import { signOut } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function getViewerState() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    const isAuthenticated = !error && Boolean(userId);

    if (!isAuthenticated || !userId) {
      return { isAuthenticated: false, isAdmin: false };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    return {
      isAuthenticated,
      isAdmin: profile?.role === "admin",
    };
  } catch {
    return { isAuthenticated: false, isAdmin: false };
  }
}

export async function SiteHeader() {
  const { isAuthenticated, isAdmin } = await getViewerState();

  return (
    <header className="sticky top-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
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
              <Button
                size="sm"
                variant={isAdmin ? "outline" : "default"}
                render={<Link href="/dashboard" />}
                nativeButton={false}
              >
                Dashboard
              </Button>
              <form action={signOut}>
                <Button size="sm" variant="ghost" type="submit">
                  <LogOutIcon data-icon="inline-start" aria-hidden="true" />
                  Logout
                </Button>
              </form>
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
