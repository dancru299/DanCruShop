"use client";

import { type ReactNode, useRef } from "react";
import { ShoppingCartIcon } from "lucide-react";

import {
  type CartProduct,
  useCart,
} from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  children?: ReactNode;
  className?: string;
  product: CartProduct;
  size?: "default" | "lg" | "sm";
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function AddToCartButton({
  children = "Add to cart",
  className,
  product,
  size = "default",
  variant = "outline",
}: AddToCartButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { addItem } = useCart();

  return (
    <Button
      ref={buttonRef}
      type="button"
      size={size}
      variant={variant}
      className={cn(
        "cursor-pointer transition-transform duration-300 hover:-translate-y-0.5",
        className
      )}
      onClick={() => addItem(product, { sourceElement: buttonRef.current })}
    >
      <ShoppingCartIcon aria-hidden="true" data-icon="inline-start" />
      {children}
    </Button>
  );
}
