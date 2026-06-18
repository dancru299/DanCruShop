"use client";

import { GitCompareIcon } from "lucide-react";

import {
  type CompareProduct,
  useCompare,
} from "@/components/compare/compare-provider";
import { cn } from "@/lib/utils";

type CompareButtonProps = {
  className?: string;
  product: CompareProduct;
};

export function CompareButton({ className, product }: CompareButtonProps) {
  const { isComparing, toggle, isLoaded } = useCompare();
  const active = isComparing(product.id);
  const label = active
    ? "Remove from comparison"
    : "Add to comparison";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      disabled={!isLoaded}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(product);
      }}
      className={cn(
        "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-60",
        active
          ? "border-primary/60 bg-primary text-primary-foreground"
          : "border-white/15 bg-black/40 text-white/85 hover:bg-black/60",
        className
      )}
    >
      <GitCompareIcon aria-hidden="true" className="size-[18px]" />
    </button>
  );
}
