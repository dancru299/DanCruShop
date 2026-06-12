"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  FileTextIcon,
  KeyRoundIcon,
  MessageSquareIcon,
  PackageIcon,
  ReceiptTextIcon,
  SettingsIcon,
  StoreIcon,
  TagIcon,
  TicketPercentIcon,
  UsersIcon,
} from "lucide-react";

import { DanCruShopLogo } from "@/components/shared/dancrushop-logo";
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
    href: "/admin/categories",
    icon: TagIcon,
    label: "Categories",
  },
  {
    href: "/admin/coupons",
    icon: TicketPercentIcon,
    label: "Coupons",
  },
  {
    href: "/admin/orders",
    icon: ReceiptTextIcon,
    label: "Orders",
  },
  {
    href: "/admin/licenses",
    icon: KeyRoundIcon,
    label: "Licenses",
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
  {
    href: "/admin/settings",
    icon: SettingsIcon,
    label: "Settings",
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
    <aside className="border-b bg-muted/25 md:min-h-dvh md:border-r md:border-b-0 md:bg-background">
      <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 py-3 md:sticky md:top-0 md:mx-0 md:w-60 md:flex-col md:px-4 md:py-6">
        <Link
          href="/admin"
          className="hidden px-3 pb-4 transition-colors hover:text-foreground/80 md:flex"
        >
          <DanCruShopLogo
            eyebrow="Admin CMS"
            markClassName="size-4"
            markContainerClassName="size-8 rounded-md"
            wordmarkClassName="text-base"
          />
        </Link>

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

        <div className="shrink-0 md:mt-3 md:border-t md:pt-3">
          <Link
            href="/"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <StoreIcon aria-hidden="true" className="size-4" />
            Về cửa hàng
          </Link>
        </div>
      </div>
    </aside>
  );
}
