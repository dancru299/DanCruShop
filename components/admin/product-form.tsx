"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  Loader2Icon,
  PackagePlusIcon,
  SaveIcon,
  TagIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createProduct,
  updateProduct,
  type ProductInsert,
  type ProductUpdate,
} from "@/actions/admin.actions";
import { AdminMediaUploadField } from "@/components/admin/media-upload-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ProductFilesDialog } from "@/components/admin/product-files-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ProductArtwork,
  formatProductPrice,
} from "@/components/products/product-card";
import type { CategoryOption } from "@/lib/supabase/queries/categories";
import type { TechIconOption } from "@/lib/supabase/queries/tech-icons";
import type {
  ProductDetail,
  ProductStatus,
  ProductType,
  PublishedProduct,
} from "@/lib/supabase/queries/products";
import { cn, slugify } from "@/lib/utils";

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
>;

type ProductFormProps = {
  mode: ProductFormMode;
  product?: ProductFormProduct;
  categories?: CategoryOption[];
  selectedCategoryIds?: string[];
  techIcons?: TechIconOption[];
  selectedTechIconIds?: string[];
};

type ProductFormErrors = {
  priceUsd?: string;
  comparePriceUsd?: string;
  slug?: string;
  title?: string;
};

const productTypeOptions: Array<{
  label: string;
  value: ProductType;
}> = [
  { label: "Digital download", value: "digital_download" },
  { label: "Course", value: "course" },
  { label: "Tool", value: "tool" },
  { label: "Template", value: "template" },
  { label: "Bundle", value: "bundle" },
  { label: "Free resource", value: "free_resource" },
];

const productStatusOptions: Array<{
  label: string;
  value: ProductStatus;
}> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "VND", value: "VND" },
] as const;

const productTypeLabels: Record<ProductType, string> = {
  bundle: "Bundle",
  course: "Course",
  digital_download: "Digital download",
  free_resource: "Free resource",
  template: "Template",
  tool: "Tool",
};

const statusBadgeVariants: Record<ProductStatus, "default" | "outline" | "secondary"> = {
  archived: "outline",
  draft: "secondary",
  published: "default",
};

function formatPriceInput(priceCents: number | undefined, currency: string) {
  if (typeof priceCents !== "number") {
    return "0";
  }

  if (currency === "VND") {
    return String(priceCents);
  }

  return (priceCents / 100).toFixed(2).replace(/\.00$/, "");
}

function parsePriceCents(value: string, currency: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  if (currency === "VND") {
    return Math.round(parsed);
  }

  return Math.round(parsed * 100);
}

function ProductPreviewPanel({
  currency,
  description,
  demoUrl,
  priceCents,
  compareCents,
  productType,
  previewUrl,
  shortDescription,
  slug,
  status,
  thumbnailUrl,
  title,
}: {
  currency: string;
  description: string;
  demoUrl: string;
  priceCents: number;
  compareCents: number | null;
  productType: ProductType;
  previewUrl: string;
  shortDescription: string;
  slug: string;
  status: ProductStatus;
  thumbnailUrl: string;
  title: string;
}) {
  const previewProduct: PublishedProduct = {
    currency,
    id: "preview",
    is_free: priceCents === 0 || productType === "free_resource",
    price_cents: priceCents,
    compare_at_price_cents: compareCents,
    product_type: productType,
    short_description: shortDescription.trim() || null,
    slug: slug || "product-slug",
    thumbnail_url: thumbnailUrl.trim() || null,
    title: title.trim() || "Untitled product",
  };
  const descriptionLines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {previewProduct.thumbnail_url ? (
            <img
              alt={previewProduct.title}
              className="absolute inset-0 size-full object-cover"
              src={previewProduct.thumbnail_url}
            />
          ) : (
            <ProductArtwork product={previewProduct} />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-4">
            <Badge variant={statusBadgeVariants[status]}>{status}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {productTypeLabels[productType]}
              </p>
              <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-7 tracking-normal">
                {previewProduct.title}
              </h2>
            </div>
            <ArrowUpRightIcon
              aria-hidden="true"
              className="mt-1 shrink-0 text-muted-foreground"
            />
          </div>

          <p className="line-clamp-3 min-h-16 text-sm leading-6 text-muted-foreground">
            {previewProduct.short_description ??
              "A concise product summary will appear here on public cards."}
          </p>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <span className="text-sm text-muted-foreground">Lifetime access</span>
            <span className="text-sm font-semibold">
              {formatProductPrice(previewProduct)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Public detail preview</h3>
            <p className="text-xs text-muted-foreground">
              /products/{previewProduct.slug}
            </p>
          </div>
          <Badge variant="outline">Preview</Badge>
        </div>

        <div className="mt-4 grid gap-3 text-sm">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Description</p>
            {descriptionLines.length > 0 ? (
              <div className="mt-2 grid gap-1 text-xs leading-5">
                {descriptionLines.map((line) => (
                  <p key={line} className="line-clamp-1">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Add a full description to make the detail page feel complete.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Demo</p>
              <p className="mt-1 truncate text-xs">
                {demoUrl.trim() ? "Connected" : "Missing"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Preview</p>
              <p className="mt-1 truncate text-xs">
                {previewUrl.trim() ? "Connected" : "Missing"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function ProductForm({
  mode,
  product,
  categories = [],
  selectedCategoryIds = [],
  techIcons = [],
  selectedTechIconIds = [],
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  // Keep auto-syncing the slug from the title unless it was customised. An
  // existing product whose slug already matches its title is treated as "in
  // sync", so renaming the product updates the slug too.
  const [slugTouched, setSlugTouched] = useState(
    mode === "edit" &&
      (product?.slug ?? "") !== slugify(product?.title ?? "")
  );
  const [shortDescription, setShortDescription] = useState(
    product?.short_description ?? ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnail_url ?? "");
  const [demoUrl, setDemoUrl] = useState(product?.demo_url ?? "");
  const [previewUrl, setPreviewUrl] = useState(product?.preview_url ?? "");
  const [lemonProductId, setLemonProductId] = useState(
    product?.lemon_squeezy_product_id ?? ""
  );
  const [lemonVariantId, setLemonVariantId] = useState(
    product?.lemon_squeezy_variant_id ?? ""
  );
  const [currency, setCurrency] = useState(product?.currency ?? "USD");
  const [priceUsd, setPriceUsd] = useState(
    formatPriceInput(product?.price_cents, product?.currency ?? "USD")
  );
  const [comparePriceUsd, setComparePriceUsd] = useState(
    product?.compare_at_price_cents != null
      ? formatPriceInput(product.compare_at_price_cents, product?.currency ?? "USD")
      : ""
  );
  const [productType, setProductType] = useState<ProductType>(
    product?.product_type ?? "digital_download"
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "draft"
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(selectedCategoryIds);
  const [techIconIds, setTechIconIds] = useState<string[]>(selectedTechIconIds);
  const [requiresLicense, setRequiresLicense] = useState(
    product?.requires_license ?? false
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});

  function toggleCategory(id: string) {
    setCategoryIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function toggleTechIcon(id: string) {
    // Appending on select keeps the click order, which becomes the badge order.
    setTechIconIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  const submitLabel = useMemo(
    () => (mode === "create" ? "Create product" : "Save changes"),
    [mode]
  );
  const previewPriceCents = parsePriceCents(priceUsd, currency) ?? 0;
  const previewCompareCents = comparePriceUsd.trim()
    ? parsePriceCents(comparePriceUsd, currency)
    : null;

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function validate() {
    const nextErrors: ProductFormErrors = {};
    const priceCents = parsePriceCents(priceUsd, currency);
    const normalizedSlug = slugify(slug);

    if (!title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!normalizedSlug) {
      nextErrors.slug = "Slug is required.";
    }

    if (priceCents === null) {
      nextErrors.priceUsd = "Price must be greater than or equal to 0.";
    }

    const hasCompare = comparePriceUsd.trim().length > 0;
    const compareCents = hasCompare
      ? parsePriceCents(comparePriceUsd, currency)
      : null;

    if (hasCompare) {
      if (compareCents === null || compareCents <= 0) {
        nextErrors.comparePriceUsd = "Giá gốc phải là số lớn hơn 0.";
      } else if (priceCents !== null && compareCents <= priceCents) {
        nextErrors.comparePriceUsd = "Giá gốc phải lớn hơn giá bán.";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || priceCents === null) {
      return null;
    }

    return {
      normalizedSlug,
      priceCents,
      compareCents,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validated = validate();

    if (!validated) {
      return;
    }

    const payload: ProductInsert = {
      categoryIds,
      techIconIds,
      currency,
      demo_url: demoUrl.trim() || null,
      description: description.trim() || null,
      is_free:
        validated.priceCents === 0 || productType === "free_resource",
      lemon_squeezy_product_id: lemonProductId.trim() || null,
      lemon_squeezy_variant_id: lemonVariantId.trim() || null,
      preview_url: previewUrl.trim() || null,
      price_cents: validated.priceCents,
      compare_at_price_cents: validated.compareCents,
      product_type: productType,
      requires_license: requiresLicense,
      short_description: shortDescription.trim() || null,
      slug: validated.normalizedSlug,
      status,
      thumbnail_url: thumbnailUrl.trim() || null,
      title: title.trim(),
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProduct(payload)
          : await updateProduct(product?.id ?? "", payload satisfies ProductUpdate);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create" ? "Product created." : "Product updated."
      );
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
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
          <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-normal">
                  Storefront content
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  These fields shape the product card and public detail page.
                </p>
              </div>
              <Badge variant={statusBadgeVariants[status]}>{status}</Badge>
            </div>

            <FieldGroup>
              <Field data-invalid={Boolean(errors.title)}>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Premium landing page kit"
                  aria-invalid={Boolean(errors.title)}
                  disabled={isPending}
                />
                <FieldError>{errors.title}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.slug)}>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                  placeholder="premium-landing-page-kit"
                  aria-invalid={Boolean(errors.slug)}
                  disabled={isPending}
                />
                <FieldDescription>
                  Used in the product URL. It is auto-generated from the title.
                </FieldDescription>
                <FieldError>{errors.slug}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="short-description">
                  Short description
                </FieldLabel>
                <Textarea
                  id="short-description"
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  placeholder="A concise product summary for cards and SEO."
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Full description</FieldLabel>
                <MarkdownEditor
                  id="description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Mô tả khách nhận được gì, dành cho ai, gồm những gì. Hỗ trợ định dạng Markdown."
                  disabled={isPending}
                />
                <FieldDescription>
                  Dùng thanh công cụ để in đậm, tạo tiêu đề, danh sách... Nội
                  dung hiển thị có định dạng ở trang sản phẩm.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </section>

          <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold tracking-normal">
                Product media
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Upload a thumbnail for product cards, or paste a remote image
                URL when the asset already lives elsewhere.
              </p>
            </div>

            <AdminMediaUploadField
              description="Recommended ratio: 16:10. Images are uploaded to the public media bucket."
              disabled={isPending}
              folder="products"
              id="thumbnail-url"
              label="Thumbnail URL"
              onChange={setThumbnailUrl}
              placeholder="https://example.com/product-thumbnail.jpg"
              value={thumbnailUrl}
            />
          </section>

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
                    onChange={(event) => setPriceUsd(event.target.value)}
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
                    onChange={(event) => setComparePriceUsd(event.target.value)}
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
                        setCurrency(value);
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
                      setProductType(value as ProductType)
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
                    onValueChange={(value) => setStatus(value as ProductStatus)}
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
                          onClick={() => toggleCategory(category.id)}
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
                <FieldLabel>Tech stack</FieldLabel>
                {techIcons.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {techIcons.map((icon) => {
                      const active = techIconIds.includes(icon.id);

                      return (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => toggleTechIcon(icon.id)}
                          disabled={isPending}
                          aria-pressed={active}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {icon.icon_url ? (
                            <img
                              alt=""
                              src={icon.icon_url}
                              className="size-4 object-contain"
                            />
                          ) : null}
                          {icon.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <FieldDescription>
                    Chưa có icon nào trong thư viện. Thêm bản ghi vào bảng
                    tech_icons để gán tech stack cho sản phẩm.
                  </FieldDescription>
                )}
                <FieldDescription>
                  Hiển thị thành badge trên card Hero ngoài trang chủ. Thứ tự
                  chọn là thứ tự hiển thị.
                </FieldDescription>
              </Field>

              <Field>
                <button
                  type="button"
                  onClick={() => setRequiresLicense((value) => !value)}
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

          <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-normal">
                  Delivery and external links
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Connect demos, previews, and Lemon Squeezy references.
                </p>
              </div>
              <ExternalLinkIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            </div>

            <FieldGroup>
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="demo-url">Demo URL</FieldLabel>
                  <Input
                    id="demo-url"
                    value={demoUrl}
                    onChange={(event) => setDemoUrl(event.target.value)}
                    placeholder="https://demo.example.com"
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="preview-url">Preview URL</FieldLabel>
                  <Input
                    id="preview-url"
                    value={previewUrl}
                    onChange={(event) => setPreviewUrl(event.target.value)}
                    placeholder="https://example.com/preview"
                    disabled={isPending}
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="lemon-product-id">
                    Lemon Squeezy product ID
                  </FieldLabel>
                  <Input
                    id="lemon-product-id"
                    value={lemonProductId}
                    onChange={(event) => setLemonProductId(event.target.value)}
                    placeholder="Optional"
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lemon-variant-id">
                    Lemon Squeezy variant ID
                  </FieldLabel>
                  <Input
                    id="lemon-variant-id"
                    value={lemonVariantId}
                    onChange={(event) => setLemonVariantId(event.target.value)}
                    placeholder="Optional"
                    disabled={isPending}
                  />
                </Field>
              </div>
            </FieldGroup>
          </section>
        </div>

        <ProductPreviewPanel
          currency={currency}
          description={description}
          demoUrl={demoUrl}
          priceCents={previewPriceCents}
          compareCents={previewCompareCents}
          productType={productType}
          previewUrl={previewUrl}
          shortDescription={shortDescription}
          slug={slug}
          status={status}
          thumbnailUrl={thumbnailUrl}
          title={title}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        {mode === "edit" && product && productType === "bundle" ? (
          <Button
            variant="outline"
            render={<Link href={`/admin/products/${product.id}/bundle`} />}
            nativeButton={false}
            disabled={isPending}
          >
            <PackagePlusIcon aria-hidden="true" data-icon="inline-start" />
            Manage bundle
          </Button>
        ) : null}
        {mode === "edit" && product ? (
          <ProductFilesDialog
            productId={product.id}
            productTitle={product.title}
            disabled={isPending}
          />
        ) : null}
        <Button
          variant="outline"
          render={<Link href="/admin/products" />}
          nativeButton={false}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <SaveIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
