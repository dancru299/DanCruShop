import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <p className="font-medium text-foreground">DanCruShop</p>
          <p>© {new Date().getFullYear()} Tool, source code và tài nguyên số cho builder.</p>
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
        </nav>
      </div>
    </footer>
  );
}
