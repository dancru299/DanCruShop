import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} DanCruShop. All rights reserved.</p>

        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/products" className="transition-colors hover:text-foreground">
            Products
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
