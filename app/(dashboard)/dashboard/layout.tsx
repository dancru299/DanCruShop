import Link from "next/link";

import { SiteHeader } from "@/components/shared/site-header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:grid-cols-[13rem_1fr]">
        <aside className="hidden md:block">
          <nav className="sticky top-24 flex flex-col gap-1 text-sm">
            <Link
              href="/dashboard"
              className="rounded-lg bg-muted px-3 py-2 font-medium text-foreground"
            >
              My Products
            </Link>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Storefront
            </Link>
          </nav>
        </aside>
        {children}
      </div>
    </div>
  );
}
