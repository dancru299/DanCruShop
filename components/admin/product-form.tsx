"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  Loader2Icon,
  PaperclipIcon,
  SaveIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createProduct,
  updateProduct,
  type ProductInsert,
  type ProductUpdate,
} from "@/actions/admin.actions";
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
import type {
  ProductDetail,
  ProductStatus,
  ProductType,
} from "@/lib/supabase/queries/products";

type ProductFormMode = "create" | "edit";

type ProductFormProduct = Pick<
  ProductDetail,
  | "id"
  | "title"
  | "slug"
  | "short_description"
  | "price_cents"
  | "currency"
  | "product_type"
  | "status"
  | "is_free"
>;

type ProductFormProps = {
  mode: ProductFormMode;
  product?: ProductFormProduct;
};

type ProductFormErrors = {
  priceUsd?: string;
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [shortDescription, setShortDescription] = useState(
    product?.short_description ?? ""
  );
  const [currency, setCurrency] = useState(product?.currency ?? "USD");
  const [priceUsd, setPriceUsd] = useState(
    formatPriceInput(product?.price_cents, product?.currency ?? "USD")
  );
  const [productType, setProductType] = useState<ProductType>(
    product?.product_type ?? "digital_download"
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "draft"
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const submitLabel = useMemo(
    () => (mode === "create" ? "Create product" : "Save changes"),
    [mode]
  );

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

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || priceCents === null) {
      return null;
    }

    return {
      normalizedSlug,
      priceCents,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validated = validate();

    if (!validated) {
      return;
    }

    const payload: ProductInsert = {
      title: title.trim(),
      slug: validated.normalizedSlug,
      short_description: shortDescription.trim() || null,
      product_type: productType,
      status,
      price_cents: validated.priceCents,
      currency,
      is_free: validated.priceCents === 0 || productType === "free_resource",
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
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-3xl flex-col gap-6"
    >
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
            Configure the storefront fields used by the product listing and
            detail pages.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
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
              Short Description
            </FieldLabel>
            <Textarea
              id="short-description"
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              placeholder="A concise product summary for cards and SEO."
              disabled={isPending}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.priceUsd)}>
              <FieldLabel htmlFor="price">Price ({currency})</FieldLabel>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={priceUsd}
                onChange={(event) => setPriceUsd(event.target.value)}
                aria-invalid={Boolean(errors.priceUsd)}
                disabled={isPending}
              />
              <FieldError>{errors.priceUsd}</FieldError>
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
              <FieldLabel>Product Type</FieldLabel>
              <Select
                value={productType}
                onValueChange={(value) => setProductType(value as ProductType)}
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
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {mode === "edit" && product ? (
          <Button
            variant="outline"
            render={<Link href={`/admin/products/${product.id}/files`} />}
            nativeButton={false}
            disabled={isPending}
          >
            <PaperclipIcon aria-hidden="true" data-icon="inline-start" />
            Manage Files
          </Button>
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
