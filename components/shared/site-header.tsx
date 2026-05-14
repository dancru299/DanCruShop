import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function getIsAuthenticated() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    return !error && Boolean(data?.claims.sub);
  } catch {
    return false;
  }
}

export async function SiteHeader() {
  const isAuthenticated = await getIsAuthenticated();

  return (
    <header className="sticky top-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-normal transition-colors hover:text-muted-foreground"
        >
          DanCruShop
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
          <Button
            size="sm"
            variant={isAuthenticated ? "default" : "outline"}
            render={
              <Link href={isAuthenticated ? "/dashboard" : "/login"} />
            }
            nativeButton={false}
          >
            {isAuthenticated ? "Dashboard" : "Login"}
          </Button>
        </div>
      </div>
    </header>
  );
}
