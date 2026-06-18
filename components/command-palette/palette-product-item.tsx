"use client";

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { BoxIcon } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";

import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import type { PaletteProduct } from "@/actions/search.actions";

/**
 * cmdk-compatible product row that participates in keyboard navigation
 * (↑↓ + Enter). Shows thumbnail, title, and price label.
 */
export function PaletteProductCommandItem({
  product,
  onSelect,
}: {
  product: PaletteProduct;
  onSelect: () => void;
}) {
  const router = useRouter();
  const { closePalette } = useCommandPalette();

  return (
    <CommandPrimitive.Item
      value={`product-${product.slug}`}
      keywords={[product.title]}
      onSelect={() => {
        router.push(`/products/${product.slug}`);
        closePalette();
        onSelect();
      }}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors data-[selected=true]:bg-muted/60"
    >
      {product.thumbnailUrl ? (
        <img
          alt=""
          src={product.thumbnailUrl}
          className="size-9 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <BoxIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {product.title}
        </p>
        <p className="text-xs text-muted-foreground">{product.priceLabel}</p>
      </div>
    </CommandPrimitive.Item>
  );
}