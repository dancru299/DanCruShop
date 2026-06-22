"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenIcon, PackageIcon, StoreIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: PackageIcon, label: "My Products" },
  { href: "/dashboard/courses", icon: BookOpenIcon, label: "My Courses" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkBase =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors";

/**
 * Customer dashboard navigation. Horizontal scroll on mobile, sticky vertical
 * on desktop, with route-aware active state. Mirrors AdminSidebar.
 */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:sticky md:top-24 md:flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              linkBase,
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {item.label}
          </Link>
        );
      })}

      <div className="shrink-0 md:mt-2 md:border-t md:pt-2">
        <Link
          href="/"
          className={cn(
            linkBase,
            "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <StoreIcon aria-hidden="true" className="size-4" />
          Storefront
        </Link>
      </div>
    </nav>
  );
}
