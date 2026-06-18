/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Fragment,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ChevronDownIcon,
  MinusIcon,
  StarIcon,
  XIcon,
} from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { CartProduct } from "@/components/cart/cart-provider";
import { useCompare } from "@/components/compare/compare-provider";
import { Badge } from "@/components/ui/badge";
import {
  formatProductPrice,
  getProductDiscount,
  productTypeLabels,
} from "@/lib/products/display";
import { SPEC_GROUPS, getSpecOption, readSpecValue } from "@/lib/products/specs";
import type { CompareProductData } from "@/lib/supabase/queries/compare";
import { cn } from "@/lib/utils";

type RowDef = {
  id: string;
  label: string;
  signature: (product: CompareProductData) => string;
  render: (product: CompareProductData) => ReactNode;
};

type GroupDef = {
  id: string;
  label: string;
  rows: RowDef[];
};

function toCartProduct(product: CompareProductData): CartProduct {
  return {
    currency: product.currency,
    id: product.id,
    isFree: product.is_free,
    priceCents: product.price_cents,
    productType: product.product_type,
    slug: product.slug,
    thumbnailUrl: product.thumbnail_url,
    title: product.title,
  };
}

function Dash() {
  return (
    <MinusIcon
      aria-label="Không có"
      className="size-4 text-muted-foreground/40"
    />
  );
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <CheckIcon
      aria-label="Có hỗ trợ"
      className="size-5 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.45)]"
    />
  ) : (
    <Dash />
  );
}

function buildGroups(): GroupDef[] {
  const overview: GroupDef = {
    id: "overview",
    label: "Tổng quan",
    rows: [
      {
        id: "price",
        label: "Giá bán",
        signature: (product) => String(product.price_cents),
        render: (product) => {
          const discount = getProductDiscount(product);

          return (
            <div className="flex flex-col">
              {discount ? (
                <span className="text-xs text-muted-foreground line-through">
                  {discount.originalLabel}
                </span>
              ) : null}
              <span className="text-base font-bold text-primary">
                {formatProductPrice(product)}
              </span>
            </div>
          );
        },
      },
      {
        id: "type",
        label: "Loại sản phẩm",
        signature: (product) => product.product_type,
        render: (product) => (
          <Badge variant="outline">
            {productTypeLabels[product.product_type]}
          </Badge>
        ),
      },
      {
        id: "rating",
        label: "Đánh giá",
        signature: (product) =>
          `${product.rating.average.toFixed(1)}|${product.rating.count}`,
        render: (product) =>
          product.rating.count > 0 ? (
            <span className="inline-flex items-center gap-1 text-sm">
              <StarIcon
                aria-hidden="true"
                className="size-4 fill-amber-400 text-amber-400"
              />
              <span className="font-semibold">
                {product.rating.average.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({product.rating.count})
              </span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Chưa có</span>
          ),
      },
    ],
  };

  const specGroups: GroupDef[] = SPEC_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    rows: group.fields.map((field) => ({
      id: field.key,
      label: field.label,
      signature: (product) => {
        const value = readSpecValue(product.metadata, field);
        if (value.type === "boolean") {
          return value.value ? "1" : "0";
        }
        return [...value.values].sort().join("|");
      },
      render: (product) => {
        const value = readSpecValue(product.metadata, field);

        if (value.type === "boolean") {
          return <BoolCell value={value.value} />;
        }

        if (value.values.length === 0) {
          return <Dash />;
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {value.values.map((item) => {
              const option = getSpecOption(field, item);

              return (
                <Badge
                  key={item}
                  variant="outline"
                  className={cn("h-5 px-2", option?.className)}
                >
                  {option?.label ?? item}
                </Badge>
              );
            })}
          </div>
        );
      },
    })),
  }));

  return [overview, ...specGroups];
}

export function CompareMatrix({
  products,
}: {
  products: CompareProductData[];
}) {
  const router = useRouter();
  const { remove } = useCompare();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [diffOnly, setDiffOnly] = useState(false);

  // Mobile shows only two columns at a time; both are swappable via dropdowns.
  const [mobilePair, setMobilePair] = useState<{ a: number; b: number }>({
    a: 0,
    b: Math.min(1, products.length - 1),
  });

  const groups = useMemo(() => buildGroups(), []);

  // Apply the "differences only" filter to a subset and drop empty groups.
  const filterGroups = useCallback(
    (subset: CompareProductData[]) =>
      groups
        .map((group) => ({
          ...group,
          rows: group.rows.filter((row) => {
            if (!diffOnly) {
              return true;
            }

            const signatures = subset.map((product) => row.signature(product));
            return new Set(signatures).size > 1;
          }),
        }))
        .filter((group) => group.rows.length > 0),
    [groups, diffOnly]
  );

  const visibleGroups = useMemo(
    () => filterGroups(products),
    [filterGroups, products]
  );

  const mobileProducts = useMemo(() => {
    const picked = [products[mobilePair.a], products[mobilePair.b]].filter(
      (product): product is CompareProductData => Boolean(product)
    );
    return picked;
  }, [products, mobilePair]);

  const mobileGroups = useMemo(
    () => filterGroups(mobileProducts),
    [filterGroups, mobileProducts]
  );

  function removeColumn(product: CompareProductData) {
    const nextSlugs = products
      .filter((item) => item.id !== product.id)
      .map((item) => encodeURIComponent(item.slug));

    remove(product.id);

    if (nextSlugs.length >= 2) {
      router.replace(`/compare?items=${nextSlugs.join(",")}`);
    } else {
      router.replace("/products");
    }
  }

  const gridTemplateColumns = `minmax(7.5rem, 1.1fr) repeat(${products.length}, minmax(0, 1fr))`;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={diffOnly}
          onChange={(event) => setDiffOnly(event.target.checked)}
          className="size-4 accent-primary"
        />
        Chỉ hiện điểm khác biệt
      </label>

      <div className="hidden overflow-x-auto md:block">
        <div
          className="grid min-w-[640px] items-stretch"
          style={{ gridTemplateColumns }}
        >
          {/* Sticky product header */}
          <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur-xl" />
          {products.map((product) => {
            const discount = getProductDiscount(product);

            return (
              <div
                key={product.id}
                className="sticky top-16 z-30 flex flex-col gap-2 border-b border-l bg-background/95 p-3 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                  >
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.title}
                        className="size-full object-cover"
                      />
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Bỏ ${product.title} khỏi so sánh`}
                    onClick={() => removeColumn(product)}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <XIcon aria-hidden="true" className="size-4" />
                  </button>
                </div>

                <Link
                  href={`/products/${product.slug}`}
                  className="line-clamp-2 text-sm font-semibold leading-5 hover:text-foreground/80"
                >
                  {product.title}
                </Link>

                <div className="flex flex-col leading-tight">
                  {discount ? (
                    <span className="text-xs text-muted-foreground line-through">
                      {discount.originalLabel}
                    </span>
                  ) : null}
                  <span className="text-sm font-bold text-primary">
                    {formatProductPrice(product)}
                  </span>
                </div>

                <AddToCartButton
                  product={toCartProduct(product)}
                  size="sm"
                  className="mt-auto w-full"
                >
                  Thêm vào giỏ
                </AddToCartButton>
              </div>
            );
          })}

          {/* Groups */}
          {visibleGroups.map((group) => {
            const isCollapsed = collapsed[group.id] ?? false;

            return (
              <Fragment key={group.id}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((current) => ({
                      ...current,
                      [group.id]: !isCollapsed,
                    }))
                  }
                  aria-expanded={!isCollapsed}
                  className="col-span-full mt-4 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-muted"
                >
                  {group.label}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                      "size-4 transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </button>

                {!isCollapsed
                  ? group.rows.map((row) => (
                      <Fragment key={row.id}>
                        <div className="flex items-center border-b border-border/60 px-3 py-3 text-sm text-muted-foreground">
                          {row.label}
                        </div>
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center border-b border-l border-border/60 px-3 py-3"
                          >
                            {row.render(product)}
                          </div>
                        ))}
                      </Fragment>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile: two swappable columns */}
      <div className="md:hidden">
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: "minmax(5.5rem, 0.8fr) repeat(2, minmax(0, 1fr))" }}
        >
          {/* Sticky header with column pickers */}
          <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur-xl" />
          {(["a", "b"] as const).map((col) => {
            const product = col === "a" ? mobileProducts[0] : mobileProducts[1];

            if (!product) {
              return <div key={col} className="border-b border-l" />;
            }

            return (
              <div
                key={col}
                className="sticky top-16 z-30 flex flex-col gap-2 border-b border-l bg-background/95 p-2 backdrop-blur-xl"
              >
                <select
                  aria-label={`Chọn sản phẩm cột ${col === "a" ? 1 : 2}`}
                  value={col === "a" ? mobilePair.a : mobilePair.b}
                  onChange={(event) => {
                    const index = Number(event.target.value);
                    setMobilePair((prev) =>
                      col === "a"
                        ? { a: index, b: prev.b === index ? prev.a : prev.b }
                        : { b: index, a: prev.a === index ? prev.b : prev.a }
                    );
                  }}
                  className="w-full rounded-md border bg-background px-1.5 py-1 text-xs font-medium"
                >
                  {products.map((option, index) => (
                    <option key={option.id} value={index}>
                      {option.title}
                    </option>
                  ))}
                </select>

                <Link
                  href={`/products/${product.slug}`}
                  className="line-clamp-2 text-xs font-semibold leading-4"
                >
                  {product.title}
                </Link>
                <span className="text-sm font-bold text-primary">
                  {formatProductPrice(product)}
                </span>
                <AddToCartButton
                  product={toCartProduct(product)}
                  size="sm"
                  className="mt-auto w-full"
                >
                  Thêm
                </AddToCartButton>
              </div>
            );
          })}

          {mobileGroups.map((group) => {
            const isCollapsed = collapsed[group.id] ?? false;

            return (
              <Fragment key={group.id}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((current) => ({
                      ...current,
                      [group.id]: !isCollapsed,
                    }))
                  }
                  aria-expanded={!isCollapsed}
                  className="col-span-full mt-4 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-muted"
                >
                  {group.label}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                      "size-4 transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </button>

                {!isCollapsed
                  ? group.rows.map((row) => (
                      <Fragment key={row.id}>
                        <div className="flex items-center border-b border-border/60 px-2 py-3 text-xs text-muted-foreground">
                          {row.label}
                        </div>
                        {mobileProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center border-b border-l border-border/60 px-2 py-3"
                          >
                            {row.render(product)}
                          </div>
                        ))}
                      </Fragment>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
