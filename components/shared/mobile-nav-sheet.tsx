"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  Grid2x2Icon,
  HeartIcon,
  MenuIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";
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
    description: "Source code, templates, and tools on sale.",
    href: "/products",
    icon: SparklesIcon,
    label: "Products",
  },
  {
    description: "Quickly browse the resource categories in the shop.",
    href: "/#danh-muc",
    icon: Grid2x2Icon,
    label: "Categories",
  },
  {
    description: "Implementation notes, launch notes, and new posts.",
    href: "/blog",
    icon: BookOpenIcon,
    label: "Blog",
  },
  {
    description: "Review your selected items and head to checkout.",
    href: "/cart",
    icon: ShoppingCartIcon,
    label: "Cart",
  },
  {
    description: "Reopen the products you saved to consider later.",
    href: "/favorites",
    icon: HeartIcon,
    label: "Favorites",
  },
] as const;

export function MobileNavSheet({
  isAdmin,
  isAuthenticated,
}: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden"
        render={<Button size="icon-sm" variant="outline" aria-label="Open menu" />}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 bg-[var(--popover)]">
        <SheetHeader className="border-b border-border/80 pb-4">
          <SheetTitle>Explore DanCruShop</SheetTitle>
          <SheetDescription>
            Quickly open products, categories, and your cart on mobile.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 px-5 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCartItem = item.href === "/cart";
            const isFavoritesItem = item.href === "/favorites";

            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-start gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-accent"
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
                    {isFavoritesItem && favoriteCount > 0 ? (
                      <Badge variant="secondary">{favoriteCount}</Badge>
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
              Store admin
            </Button>
          ) : null}
          <Button
            className={cn("w-full", isAuthenticated && "hidden")}
            render={<Link href="/login" />}
            nativeButton={false}
            onClick={() => setOpen(false)}
            variant={isAdmin ? "outline" : "default"}
          >
            Log in
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
