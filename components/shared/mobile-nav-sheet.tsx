"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  Grid2x2Icon,
  MenuIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MobileNavSheetProps = {
  isAdmin: boolean;
  isAuthenticated: boolean;
};

const navItems = [
  {
    description: "Kho source code, template và tool đang mở bán.",
    href: "/products",
    icon: SparklesIcon,
    label: "Sản phẩm",
  },
  {
    description: "Quét nhanh các nhóm tài nguyên đang có trong shop.",
    href: "/#danh-muc",
    icon: Grid2x2Icon,
    label: "Danh mục",
  },
  {
    description: "Ghi chú triển khai, launch notes và bài viết mới.",
    href: "/blog",
    icon: BookOpenIcon,
    label: "Bài viết",
  },
  {
    description: "Xem các món đã chọn và đi đến checkout.",
    href: "/cart",
    icon: ShoppingCartIcon,
    label: "Giỏ hàng",
  },
] as const;

export function MobileNavSheet({
  isAdmin,
  isAuthenticated,
}: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden"
        render={<Button size="icon-sm" variant="outline" aria-label="Mở menu" />}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="gap-0">
        <SheetHeader className="border-b border-border/80 pb-4">
          <SheetTitle>Khám phá DanCruShop</SheetTitle>
          <SheetDescription>
            Mở nhanh sản phẩm, danh mục và giỏ hàng ngay trên mobile.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 px-5 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCartItem = item.href === "/cart";

            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-start gap-3 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 text-card-foreground transition-colors hover:bg-accent/60"
                onClick={() => setOpen(false)}
              >
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground shadow-sm">
                  <Icon aria-hidden="true" className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {isCartItem && itemCount > 0 ? (
                      <Badge variant="secondary">{itemCount}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ArrowRightIcon
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            );
          })}
        </div>

        <SheetFooter className="border-t border-border/80 pt-4">
          {isAdmin ? (
            <Button
              className="w-full"
              render={<Link href="/admin" />}
              nativeButton={false}
              onClick={() => setOpen(false)}
              variant="secondary"
            >
              Quản trị cửa hàng
            </Button>
          ) : null}
          <Button
            className={cn("w-full", isAuthenticated && "hidden")}
            render={<Link href="/login" />}
            nativeButton={false}
            onClick={() => setOpen(false)}
            variant={isAdmin ? "outline" : "default"}
          >
            Đăng nhập
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
