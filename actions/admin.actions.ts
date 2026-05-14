"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type {
  ProductStatus,
  ProductType,
} from "@/lib/supabase/queries/products";

const productTypes = [
  "digital_download",
  "course",
  "tool",
  "template",
  "bundle",
  "free_resource",
] as const satisfies readonly ProductType[];

const productStatuses = [
  "draft",
  "published",
  "archived",
] as const satisfies readonly ProductStatus[];

export type ProductInsert = {
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  product_type: ProductType;
  status: ProductStatus;
  price_cents: number;
  currency?: string;
  is_free?: boolean;
  thumbnail_url?: string | null;
  demo_url?: string | null;
  preview_url?: string | null;
  lemon_squeezy_product_id?: string | null;
  lemon_squeezy_variant_id?: string | null;
  metadata?: Record<string, unknown>;
};

export type ProductUpdate = Partial<ProductInsert>;

export type AdminProductActionResult =
  | {
      ok: true;
      productId: string;
    }
  | {
      ok: false;
      error: string;
    };

type ProductPayload = Record<string, unknown>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && productTypes.includes(value as ProductType);
}

function isProductStatus(value: unknown): value is ProductStatus {
  return (
    typeof value === "string" &&
    productStatuses.includes(value as ProductStatus)
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function validatePriceCents(value: unknown) {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error("Price must be greater than or equal to 0.");
  }

  return Number(value);
}

function normalizeCurrency(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();

  return normalized || "USD";
}

function normalizeProductInsert(data: ProductInsert): ProductPayload {
  const title = data.title.trim();
  const slug = slugify(data.slug || data.title);

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!slug) {
    throw new Error("Slug is required.");
  }

  if (!isProductType(data.product_type)) {
    throw new Error("Product type is invalid.");
  }

  if (!isProductStatus(data.status)) {
    throw new Error("Status is invalid.");
  }

  const priceCents = validatePriceCents(data.price_cents);

  return {
    title,
    slug,
    short_description: nullableText(data.short_description),
    description: nullableText(data.description),
    product_type: data.product_type,
    status: data.status,
    price_cents: priceCents,
    currency: normalizeCurrency(data.currency),
    is_free:
      typeof data.is_free === "boolean"
        ? data.is_free
        : priceCents === 0 || data.product_type === "free_resource",
    thumbnail_url: nullableText(data.thumbnail_url),
    demo_url: nullableText(data.demo_url),
    preview_url: nullableText(data.preview_url),
    lemon_squeezy_product_id: nullableText(data.lemon_squeezy_product_id),
    lemon_squeezy_variant_id: nullableText(data.lemon_squeezy_variant_id),
    metadata: data.metadata ?? {},
  };
}

function normalizeProductUpdate(data: ProductUpdate): ProductPayload {
  const payload: ProductPayload = {};

  if ("title" in data) {
    const title = data.title?.trim();

    if (!title) {
      throw new Error("Title is required.");
    }

    payload.title = title;
  }

  if ("slug" in data) {
    const slug = slugify(data.slug ?? "");

    if (!slug) {
      throw new Error("Slug is required.");
    }

    payload.slug = slug;
  }

  if ("short_description" in data) {
    payload.short_description = nullableText(data.short_description);
  }

  if ("description" in data) {
    payload.description = nullableText(data.description);
  }

  if ("product_type" in data) {
    if (!isProductType(data.product_type)) {
      throw new Error("Product type is invalid.");
    }

    payload.product_type = data.product_type;
  }

  if ("status" in data) {
    if (!isProductStatus(data.status)) {
      throw new Error("Status is invalid.");
    }

    payload.status = data.status;
  }

  if ("price_cents" in data) {
    payload.price_cents = validatePriceCents(data.price_cents);
  }

  if ("currency" in data) {
    payload.currency = normalizeCurrency(data.currency);
  }

  if ("is_free" in data) {
    payload.is_free = Boolean(data.is_free);
  }

  if ("thumbnail_url" in data) {
    payload.thumbnail_url = nullableText(data.thumbnail_url);
  }

  if ("demo_url" in data) {
    payload.demo_url = nullableText(data.demo_url);
  }

  if ("preview_url" in data) {
    payload.preview_url = nullableText(data.preview_url);
  }

  if ("lemon_squeezy_product_id" in data) {
    payload.lemon_squeezy_product_id = nullableText(
      data.lemon_squeezy_product_id
    );
  }

  if ("lemon_squeezy_variant_id" in data) {
    payload.lemon_squeezy_variant_id = nullableText(
      data.lemon_squeezy_variant_id
    );
  }

  if ("metadata" in data) {
    payload.metadata = data.metadata ?? {};
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No product fields were provided.");
  }

  return payload;
}

function revalidateProductSurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");

  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
}

export async function createProduct(
  data: ProductInsert
): Promise<AdminProductActionResult> {
  try {
    await requireAdmin();

    const payload = normalizeProductInsert(data);
    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create product", error);
      return { ok: false, error: error.message };
    }

    revalidateProductSurfaces(String(payload.slug));

    return { ok: true, productId: String(product.id) };
  } catch (error) {
    console.error("Unexpected error while creating product", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function updateProduct(
  id: string,
  data: ProductUpdate
): Promise<AdminProductActionResult> {
  try {
    await requireAdmin();

    const productId = id.trim();

    if (!productId) {
      throw new Error("Product id is required.");
    }

    const payload = normalizeProductUpdate(data);
    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to update product", error);
      return { ok: false, error: error.message };
    }

    revalidateProductSurfaces(
      typeof payload.slug === "string" ? payload.slug : undefined
    );

    return { ok: true, productId: String(product.id) };
  } catch (error) {
    console.error("Unexpected error while updating product", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}
