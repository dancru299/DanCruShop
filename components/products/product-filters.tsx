"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { productTypeLabels } from "@/lib/products/display";
import type {
  ProductCategory,
  ProductType,
} from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

type ProductFiltersProps = {
  categories: ProductCategory[];
};

const productTypes = Object.keys(productTypeLabels) as ProductType[];

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const activeType = searchParams.get("type") ?? "";

  function buildUrl(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete("page");
    return `/products?${params.toString()}`;
  }

  function toggle(key: string, current: string, value: string) {
    router.push(buildUrl(key, current === value ? "" : value));
  }

  const hasActiveFilters = Boolean(activeCategory || activeType);

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("type");
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Category:
          </span>
          {categories.map((cat) => (
            <FilterPill
              key={cat.slug}
              label={cat.name}
              active={activeCategory === cat.slug}
              onClick={() => toggle("category", activeCategory, cat.slug)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Type:
        </span>
        {productTypes.map((t) => (
          <FilterPill
            key={t}
            label={productTypeLabels[t]}
            active={activeType === t}
            onClick={() => toggle("type", activeType, t)}
          />
        ))}
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="w-fit text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
