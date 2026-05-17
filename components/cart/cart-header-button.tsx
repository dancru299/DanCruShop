"use client";

import Link from "next/link";
import { ShoppingCartIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";

export function CartHeaderButton() {
  const { itemCount } = useCart();

  return (
    <Button
      aria-label={`Cart with ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      className="relative"
      data-cart-target
      render={<Link href="/cart" />}
      nativeButton={false}
      size="icon"
      variant="outline"
    >
      <ShoppingCartIcon aria-hidden="true" />
      {itemCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[0.65rem] font-semibold leading-5 text-emerald-950 shadow-sm">
          {itemCount}
        </span>
      ) : null}
    </Button>
  );
}

