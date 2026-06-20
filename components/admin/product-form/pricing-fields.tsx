import Link from "next/link";
import { KeyRoundIcon, TagIcon } from "lucide-react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/lib/supabase/queries/categories";
import type { ProductStatus, ProductType } from "@/lib/supabase/queries/products";

import {
  currencyOptions,
  productStatusOptions,
  productTypeOptions,
} from "./constants";

type PricingFieldsProps = {
  priceUsd: string;
  comparePriceUsd: string;
  currency: string;
  productType: ProductType;
  status: ProductStatus;
  categoryIds: string[];
  requiresLicense: boolean;
  errors: {
    priceUsd?: string;
    comparePriceUsd?: string;
  };
  isPending: boolean;
  categories: CategoryOption[];
  onPriceUsdChange: (value: string) => void;
  onComparePriceUsdChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onProductTypeChange: (value: ProductType) => void;
  onStatusChange: (value: ProductStatus) => void;
  onCategoryToggle: (id: string) => void;
  onRequiresLicenseToggle: () => void;
};

export function PricingFields({
  priceUsd,
  comparePriceUsd,
  currency,
  productType,
  status,
  categoryIds,
  requiresLicense,
  errors,
  isPending,
  categories,
  onPriceUsdChange,
  onComparePriceUsdChange,
  onCurrencyChange,
  onProductTypeChange,
  onStatusChange,
  onCategoryToggle,
  onRequiresLicenseToggle,
}: PricingFieldsProps) {
  return (
    <>
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold tracking-normal">
            Pricing and publishing
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Control catalog state, pricing, and product type.
          </p>
        </div>

        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.priceUsd)}>
              <FieldLabel htmlFor="price">Price ({currency})</FieldLabel>
              <Input
                id="price"
                type="number"
                min="0"
                step={currency === "VND" ? "1" : "0.01"}
                value={priceUsd}
                onChange={(event) => onPriceUsdChange(event.target.value)}
                aria-invalid={Boolean(errors.priceUsd)}
                disabled={isPending}
              />
              <FieldError>{errors.priceUsd}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.comparePriceUsd)}>
              <FieldLabel htmlFor="compare-price">
                Giá gốc ({currency})
              </FieldLabel>
              <Input
                id="compare-price"
                type="number"
                min="0"
                step={currency === "VND" ? "1" : "0.01"}
                value={comparePriceUsd}
                onChange={(event) => onComparePriceUsdChange(event.target.value)}
                placeholder="Bỏ trống nếu không giảm giá"
                aria-invalid={Boolean(errors.comparePriceUsd)}
                disabled={isPending}
              />
              <FieldDescription>
                Để hiện giá gạch ngang + badge giảm giá. Phải lớn hơn giá bán.
              </FieldDescription>
              <FieldError>{errors.comparePriceUsd}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Currency</FieldLabel>
              <Select
                value={currency}
                onValueChange={(value) => {
                  if (value) {
                    onCurrencyChange(value);
                  }
                }}
              >
                <SelectTrigger className="w-full" disabled={isPending}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel>Product type</FieldLabel>
              <Select
                value={productType}
                onValueChange={(value) =>
                  onProductTypeChange(value as ProductType)
                }
              >
                <SelectTrigger className="w-full" disabled={isPending}>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {productTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(value) => onStatusChange(value as ProductStatus)}
              >
                <SelectTrigger className="w-full" disabled={isPending}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {productStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
      </section>

      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-normal">
              Categories & licensing
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Gắn category để khách lọc sản phẩm, và bật license key cho tool
              cần kích hoạt.
            </p>
          </div>
          <TagIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Categories</FieldLabel>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const active = categoryIds.includes(category.id);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onCategoryToggle(category.id)}
                      disabled={isPending}
                      className={cn(
                        "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <FieldDescription>
                Chưa có category nào.{" "}
                <Link
                  href="/admin/categories"
                  className="font-medium underline underline-offset-4"
                >
                  Tạo category
                </Link>{" "}
                trước để gán cho sản phẩm.
              </FieldDescription>
            )}
          </Field>

          <Field>
            <button
              type="button"
              onClick={onRequiresLicenseToggle}
              disabled={isPending}
              aria-pressed={requiresLicense}
              className={cn(
                "flex items-center justify-between gap-4 rounded-lg border p-3 text-left transition-colors",
                requiresLicense
                  ? "border-primary bg-primary/5"
                  : "bg-background hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                  <KeyRoundIcon aria-hidden="true" className="size-4" />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">
                    Yêu cầu license key
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tự sinh key kích hoạt cho mỗi người mua sản phẩm này.
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
                  requiresLicense ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "size-4 rounded-full bg-background transition-transform",
                    requiresLicense ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </span>
            </button>
          </Field>
        </div>
      </section>
    </>
  );
}
