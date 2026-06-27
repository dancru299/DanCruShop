"use client";

import Link from "next/link";
import { ArrowLeftIcon, InfoIcon, Loader2Icon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryOption } from "@/lib/supabase/queries/categories";
import type { ProductDetail } from "@/lib/supabase/queries/products";

import { useProductForm } from "./product-form/use-product-form";
import { ProductPreviewPanel } from "./product-form/product-preview-panel";
import { StorefrontFields } from "./product-form/storefront-fields";
import { ClassificationFields } from "./product-form/classification-fields";
import { SpecsFields } from "./product-form/specs-fields";
import { DeliveryFields } from "./product-form/delivery-fields";

type ProductFormMode = "create" | "edit";

type ProductFormProduct = Pick<
  ProductDetail,
  | "id"
  | "title"
  | "slug"
  | "short_description"
  | "description"
  | "price_cents"
  | "compare_at_price_cents"
  | "currency"
  | "product_type"
  | "status"
  | "is_free"
  | "thumbnail_url"
  | "demo_url"
  | "preview_url"
  | "lemon_squeezy_product_id"
  | "lemon_squeezy_variant_id"
  | "requires_license"
  | "metadata"
>;

type ProductFormProps = {
  mode: ProductFormMode;
  product?: ProductFormProduct;
  categories?: CategoryOption[];
  selectedCategoryIds?: string[];
};

export function ProductForm({
  mode,
  product,
  categories = [],
  selectedCategoryIds = [],
}: ProductFormProps) {
  const form = useProductForm({ mode, product, categories, selectedCategoryIds });

  return (
    <form onSubmit={form.handleSubmit} className="flex w-full flex-col gap-6">
      {mode === "create" ? (
        <div className="flex flex-col gap-2">
          <Button
            className="w-fit"
            variant="ghost"
            render={<Link href="/admin/products" />}
            nativeButton={false}
          >
            <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
            Quay lại danh sách sản phẩm
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-normal">
              Sản phẩm mới
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Nhập nội dung dùng chung. Sau khi tạo, đặt giá và tải file ở tab
              Option.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm leading-6 text-foreground">
          <InfoIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <p>
            Đây là nội dung dùng chung cho mọi option. Giá, file, slug, trạng
            thái và mã thanh toán của từng option đặt ở{" "}
            <strong className="font-medium">tab Option</strong>.
          </p>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <StorefrontFields
            title={form.title}
            slug={form.slug}
            status={form.status}
            shortDescription={form.shortDescription}
            description={form.description}
            thumbnailUrl={form.thumbnailUrl}
            errors={form.errors}
            isPending={form.isPending}
            onTitleChange={form.handleTitleChange}
            onSlugChange={form.handleSlugChange}
            onStatusChange={form.setStatus}
            onShortDescriptionChange={form.setShortDescription}
            onDescriptionChange={form.setDescription}
            onThumbnailUrlChange={form.setThumbnailUrl}
          />

          <ClassificationFields
            productType={form.productType}
            currency={form.currency}
            categoryIds={form.categoryIds}
            isPending={form.isPending}
            categories={form.categories}
            onProductTypeChange={form.setProductType}
            onCurrencyChange={form.setCurrency}
            onCategoryToggle={form.toggleCategory}
          />

          <SpecsFields
            specState={form.specState}
            isPending={form.isPending}
            onToggleSpecOption={form.toggleSpecOption}
            onToggleSpecBoolean={form.toggleSpecBoolean}
          />

          <DeliveryFields
            demoUrl={form.demoUrl}
            previewUrl={form.previewUrl}
            githubRepo={form.githubRepo}
            isCheckingRepo={form.isCheckingRepo}
            repoCheck={form.repoCheck}
            isPending={form.isPending}
            onDemoUrlChange={form.setDemoUrl}
            onPreviewUrlChange={form.setPreviewUrl}
            onGithubRepoChange={form.setGithubRepo}
            onClearRepoCheck={() => form.setRepoCheck(null)}
            onCheckRepo={form.handleCheckRepo}
          />
        </div>

        <ProductPreviewPanel
          currency={form.currency}
          description={form.description}
          demoUrl={form.demoUrl}
          priceCents={form.previewPriceCents}
          compareCents={form.previewCompareCents}
          productType={form.productType}
          previewUrl={form.previewUrl}
          shortDescription={form.shortDescription}
          slug={form.slug}
          status={form.status}
          thumbnailUrl={form.thumbnailUrl}
          title={form.title}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          render={<Link href="/admin/products" />}
          nativeButton={false}
          disabled={form.isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={form.isPending}>
          {form.isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <SaveIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {form.isPending ? "Đang lưu..." : form.submitLabel}
        </Button>
      </div>
    </form>
  );
}
