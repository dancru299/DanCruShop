"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  FileTextIcon,
  MessageSquareIcon,
  PackageIcon,
  ReceiptTextIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    href: "/admin",
    icon: BarChart3Icon,
    label: "Overview",
  },
  {
    href: "/admin/products",
    icon: PackageIcon,
    label: "Products",
  },
  {
    href: "/admin/orders",
    icon: ReceiptTextIcon,
    label: "Orders",
  },
  {
    href: "/admin/blog",
    icon: FileTextIcon,
    label: "Blog",
  },
  {
    href: "/admin/reviews",
    icon: MessageSquareIcon,
    label: "Reviews",
  },
  {
    href: "/admin/users",
    icon: UsersIcon,
    label: "Customers",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b bg-muted/25 md:min-h-[calc(100dvh-4rem)] md:border-r md:border-b-0 md:bg-background">
      <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 py-3 md:sticky md:top-20 md:mx-0 md:w-60 md:flex-col md:px-4 md:py-6">
        <div className="hidden flex-col gap-1 px-3 pb-4 md:flex">
          <p className="text-xs font-medium text-muted-foreground">
            Admin CMS
          </p>
          <p className="text-lg font-semibold tracking-normal">DanCruShop</p>
        </div>

        <nav className="flex gap-1 md:flex-col">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
