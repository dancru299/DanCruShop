"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  DownloadIcon,
  LayersIcon,
  PackagePlusIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";

import type { ProductType } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

type ProductWorkspaceTabsProps = {
  productId: string;
  productType: ProductType;
};

type TabDef = {
  segment: string;
  label: string;
  Icon: LucideIcon;
};

// Tabs shared by every product management surface. Bundle/course only apply to
// their product types, so they appear conditionally.
const coreTabs: TabDef[] = [
  { Icon: SlidersHorizontalIcon, label: "Tổng quan", segment: "edit" },
  { Icon: LayersIcon, label: "Phiên bản", segment: "options" },
  { Icon: DownloadIcon, label: "Tải xuống", segment: "downloads" },
];

export function ProductWorkspaceTabs({
  productId,
  productType,
}: ProductWorkspaceTabsProps) {
  const pathname = usePathname();
  const basePath = `/admin/products/${productId}`;

  const tabs: TabDef[] = [...coreTabs];

  if (productType === "bundle") {
    tabs.push({ Icon: PackagePlusIcon, label: "Bộ sản phẩm", segment: "bundle" });
  }

  if (productType === "course") {
    tabs.push({ Icon: BookOpenIcon, label: "Khóa học", segment: "course" });
  }

  return (
    <nav
      aria-label="Quản lý sản phẩm"
      className="-mb-px flex gap-1 overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const href = `${basePath}/${tab.segment}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <tab.Icon aria-hidden="true" className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
