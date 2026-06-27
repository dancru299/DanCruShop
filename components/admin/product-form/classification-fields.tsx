import Link from "next/link";
import { TagIcon } from "lucide-react";

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/lib/supabase/queries/categories";
import type { ProductType } from "@/lib/supabase/queries/products";

import { currencyOptions, productTypeOptions } from "./constants";

type ClassificationFieldsProps = {
  productType: ProductType;
  currency: string;
  categoryIds: string[];
  isPending: boolean;
  categories: CategoryOption[];
  onProductTypeChange: (value: ProductType) => void;
  onCurrencyChange: (value: string) => void;
  onCategoryToggle: (id: string) => void;
};

// Shared product classification: type + categories. These apply to the whole
// option group (they describe the listing, not a single tier), so they live in
// the Tổng quan tab alongside the rest of the shared content.
export function ClassificationFields({
  productType,
  currency,
  categoryIds,
  isPending,
  categories,
  onProductTypeChange,
  onCurrencyChange,
  onCategoryToggle,
}: ClassificationFieldsProps) {
  return (
    <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal">
            Phân loại &amp; danh mục
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Loại sản phẩm và category dùng để khách lọc — áp dụng cho cả nhóm
            option.
          </p>
        </div>
        <TagIcon aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel>Loại sản phẩm</FieldLabel>
            <Select
              value={productType}
              onValueChange={(value) => onProductTypeChange(value as ProductType)}
            >
              <SelectTrigger className="w-full" disabled={isPending}>
                <SelectValue placeholder="Chọn loại sản phẩm" />
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
            <FieldLabel>Tiền tệ</FieldLabel>
            <Select
              value={currency}
              onValueChange={(value) => {
                if (value) onCurrencyChange(value);
              }}
            >
              <SelectTrigger className="w-full" disabled={isPending}>
                <SelectValue placeholder="Chọn tiền tệ" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Áp dụng cho mọi phiên bản của sản phẩm.
            </FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel>Danh mục</FieldLabel>
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
      </div>
    </section>
  );
}
