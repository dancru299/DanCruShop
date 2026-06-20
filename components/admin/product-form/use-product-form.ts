"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  checkProductGithubRepo,
  createProduct,
  updateProduct,
  type ProductInsert,
  type ProductUpdate,
} from "@/actions/admin.actions";
import { readSpecValue, SPEC_FIELDS, buildSpecsForSave, type SpecFieldType } from "@/lib/products/specs";
import type { CategoryOption } from "@/lib/supabase/queries/categories";
import type {
  ProductDetail,
  ProductStatus,
  ProductType,
} from "@/lib/supabase/queries/products";
import { slugify } from "@/lib/utils";

import {
  formatPriceInput,
  parsePriceCents,
} from "./constants";

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

type ProductFormErrors = {
  priceUsd?: string;
  comparePriceUsd?: string;
  slug?: string;
  title?: string;
};

type ProductFormInput = {
  mode: ProductFormMode;
  product?: ProductFormProduct;
  categories?: CategoryOption[];
  selectedCategoryIds?: string[];
};

export function useProductForm({
  mode,
  product,
  categories = [],
  selectedCategoryIds = [],
}: ProductFormInput) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
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
  const [requiresLicense, setRequiresLicense] = useState(
    product?.requires_license ?? false
  );
  const [githubRepo, setGithubRepo] = useState(
    typeof product?.metadata?.github_repo === "string"
      ? product.metadata.github_repo
      : ""
  );
  const [isCheckingRepo, startCheckRepo] = useTransition();
  const [repoCheck, setRepoCheck] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [specState, setSpecState] = useState<
    Record<string, string[] | boolean>
  >(() => {
    const metadata = product?.metadata ?? {};
    const initial: Record<string, string[] | boolean> = {};

    for (const field of SPEC_FIELDS) {
      const value = readSpecValue(metadata, field);
      initial[field.key] =
        value.type === "boolean" ? value.value : value.values;
    }

    return initial;
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});

  function toggleSpecOption(key: string, value: string, type: SpecFieldType) {
    setSpecState((current) => {
      const selected = Array.isArray(current[key]) ? (current[key] as string[]) : [];

      if (type === "single") {
        return { ...current, [key]: selected[0] === value ? [] : [value] };
      }

      return {
        ...current,
        [key]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  }

  function toggleSpecBoolean(key: string) {
    setSpecState((current) => ({ ...current, [key]: current[key] !== true }));
  }

  function handleCheckRepo() {
    setRepoCheck(null);
    startCheckRepo(async () => {
      const result = await checkProductGithubRepo(githubRepo);

      if (result.ok) {
        setRepoCheck({
          ok: true,
          message: `Kết nối thành công (${
            result.authenticated ? "đã xác thực PAT" : "ẩn danh"
          }) — tìm thấy ${result.conventionalCount}/${
            result.totalFetched
          } commit hợp lệ gần nhất.`,
        });
      } else {
        setRepoCheck({ ok: false, message: result.message });
      }
    });
  }

  function toggleCategory(id: string) {
    setCategoryIds((current) =>
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

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(slugify(value));
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

    const nextMetadata: Record<string, unknown> = { ...(product?.metadata ?? {}) };
    const trimmedRepo = githubRepo.trim();
    if (trimmedRepo) {
      nextMetadata.github_repo = trimmedRepo;
    } else {
      delete nextMetadata.github_repo;
    }

    const specs = buildSpecsForSave(specState);
    if (Object.keys(specs).length > 0) {
      nextMetadata.specs = specs;
    } else {
      delete nextMetadata.specs;
    }

    delete nextMetadata.tech_stack;

    const payload: ProductInsert = {
      categoryIds,
      currency,
      metadata: nextMetadata,
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

  return {
    title,
    slug,
    slugTouched,
    shortDescription,
    description,
    thumbnailUrl,
    demoUrl,
    previewUrl,
    lemonProductId,
    lemonVariantId,
    currency,
    priceUsd,
    comparePriceUsd,
    productType,
    status,
    categoryIds,
    requiresLicense,
    githubRepo,
    isCheckingRepo,
    repoCheck,
    specState,
    errors,
    isPending,
    submitLabel,
    previewPriceCents,
    previewCompareCents,
    categories,
    product,
    mode,
    setTitle,
    setSlug,
    setSlugTouched,
    setShortDescription,
    setDescription,
    setThumbnailUrl,
    setDemoUrl,
    setPreviewUrl,
    setLemonProductId,
    setLemonVariantId,
    setCurrency,
    setPriceUsd,
    setComparePriceUsd,
    setProductType,
    setStatus,
    setCategoryIds,
    setRequiresLicense,
    setGithubRepo,
    setRepoCheck,
    setSpecState,
    toggleSpecOption,
    toggleSpecBoolean,
    handleCheckRepo,
    toggleCategory,
    handleTitleChange,
    handleSlugChange,
    handleSubmit,
  };
}
