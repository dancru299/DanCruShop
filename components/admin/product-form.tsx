"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  Loader2Icon,
  PackagePlusIcon,
  SaveIcon,
} from "lucide-react";

import { ProductFilesDialog } from "@/components/admin/product-files-dialog";
import { Button } from "@/components/ui/button";
import type { CategoryOption } from "@/lib/supabase/queries/categories";
import type { ProductDetail } from "@/lib/supabase/queries/products";

import { useProductForm } from "./product-form/use-product-form";
import { ProductPreviewPanel } from "./product-form/product-preview-panel";
import { StorefrontFields } from "./product-form/storefront-fields";
import { PricingFields } from "./product-form/pricing-fields";
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
      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          variant="ghost"
          render={<Link href="/admin/products" />}
          nativeButton={false}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Back to products
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-normal">
            {mode === "create" ? "New Product" : "Edit Product"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Build the product listing, media, checkout references, and public
            preview in one workspace.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <StorefrontFields
            title={form.title}
            slug={form.slug}
            shortDescription={form.shortDescription}
            description={form.description}
            thumbnailUrl={form.thumbnailUrl}
            status={form.status}
            errors={form.errors}
            isPending={form.isPending}
            onTitleChange={form.handleTitleChange}
            onSlugChange={form.handleSlugChange}
            onShortDescriptionChange={form.setShortDescription}
            onDescriptionChange={form.setDescription}
            onThumbnailUrlChange={form.setThumbnailUrl}
          />

          <PricingFields
            priceUsd={form.priceUsd}
            comparePriceUsd={form.comparePriceUsd}
            currency={form.currency}
            productType={form.productType}
            status={form.status}
            categoryIds={form.categoryIds}
            requiresLicense={form.requiresLicense}
            errors={form.errors}
            isPending={form.isPending}
            categories={form.categories}
            onPriceUsdChange={form.setPriceUsd}
            onComparePriceUsdChange={form.setComparePriceUsd}
            onCurrencyChange={form.setCurrency}
            onProductTypeChange={form.setProductType}
            onStatusChange={form.setStatus}
            onCategoryToggle={form.toggleCategory}
            onRequiresLicenseToggle={() => form.setRequiresLicense((v) => !v)}
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
            lemonProductId={form.lemonProductId}
            lemonVariantId={form.lemonVariantId}
            githubRepo={form.githubRepo}
            isCheckingRepo={form.isCheckingRepo}
            repoCheck={form.repoCheck}
            isPending={form.isPending}
            onDemoUrlChange={form.setDemoUrl}
            onPreviewUrlChange={form.setPreviewUrl}
            onLemonProductIdChange={form.setLemonProductId}
            onLemonVariantIdChange={form.setLemonVariantId}
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
        {mode === "edit" && product && form.productType === "bundle" ? (
          <Button
            variant="outline"
            render={<Link href={`/admin/products/${product.id}/bundle`} />}
            nativeButton={false}
            disabled={form.isPending}
          >
            <PackagePlusIcon aria-hidden="true" data-icon="inline-start" />
            Manage bundle
          </Button>
        ) : null}
        {mode === "edit" && product ? (
          <ProductFilesDialog
            productId={product.id}
            productTitle={product.title}
            disabled={form.isPending}
          />
        ) : null}
        <Button
          variant="outline"
          render={<Link href="/admin/products" />}
          nativeButton={false}
          disabled={form.isPending}
        >
          Cancel
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
          {form.isPending ? "Saving..." : form.submitLabel}
        </Button>
      </div>
    </form>
  );
}
