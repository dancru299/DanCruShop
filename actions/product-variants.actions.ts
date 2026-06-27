"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type ProductVariantsActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateVariantResult =
  | { ok: true; variantId: string }
  | { ok: false; error: string };

export type UpdateVariantInput = {
  name: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  is_active: boolean;
  requires_license: boolean;
  lemon_squeezy_variant_id: string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Keep the product row's price mirror in sync with its default variant so the
// catalog/listing/search (which read products.price_cents) stay correct.
async function syncProductMirror(
  supabase: SupabaseServerClient,
  productId: string
) {
  const { data: def } = await supabase
    .from("product_variants")
    .select(
      "price_cents, compare_at_price_cents, is_free, lemon_squeezy_variant_id, requires_license"
    )
    .eq("product_id", productId)
    .eq("is_default", true)
    .maybeSingle();

  if (!def) {
    return;
  }

  await supabase
    .from("products")
    .update({
      price_cents: def.price_cents,
      compare_at_price_cents: def.compare_at_price_cents,
      is_free: def.is_free,
      lemon_squeezy_variant_id: def.lemon_squeezy_variant_id,
      requires_license: def.requires_license,
    })
    .eq("id", productId);
}

function revalidateProductSurfaces(productId: string) {
  revalidatePath(`/admin/products/${productId}/options`);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}

// Adds a lightweight variant row to an existing product — no product is cloned.
export async function createVariant(
  productId: string
): Promise<CreateVariantResult> {
  try {
    await requireAdmin();

    const id = productId.trim();

    if (!id) {
      throw new Error("Thiếu sản phẩm.");
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("product_variants")
      .select("position")
      .eq("product_id", id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = ((existing?.position as number | undefined) ?? -1) + 1;

    // First variant of a product is its default.
    const { count } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);

    const { data: created, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: id,
        name: `Phiên bản ${nextPosition + 1}`,
        position: nextPosition,
        is_default: (count ?? 0) === 0,
        price_cents: 0,
        is_free: true,
      })
      .select("id")
      .single();

    if (error || !created) {
      console.error("Failed to create variant", error);
      throw new Error("Không thể thêm phiên bản. Vui lòng thử lại.");
    }

    await syncProductMirror(supabase, id);
    revalidateProductSurfaces(id);

    return { ok: true, variantId: created.id as string };
  } catch (error) {
    console.error("Unexpected error while creating variant", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function updateVariant(
  variantId: string,
  input: UpdateVariantInput
): Promise<ProductVariantsActionResult> {
  try {
    await requireAdmin();

    const id = variantId.trim();

    if (!id) {
      throw new Error("Thiếu phiên bản.");
    }

    const price = input.price_cents;

    if (!Number.isInteger(price) || price < 0) {
      throw new Error("Giá phải là số nguyên ≥ 0.");
    }

    const compare = input.compare_at_price_cents;

    if (compare !== null) {
      if (!Number.isInteger(compare) || compare <= 0) {
        throw new Error("Giá gốc phải là số nguyên > 0.");
      }
      if (compare <= price) {
        throw new Error("Giá gốc phải lớn hơn giá bán.");
      }
    }

    const name = input.name.trim();

    if (!name) {
      throw new Error("Phiên bản cần có tên.");
    }

    const supabase = await createClient();
    const { data: variant, error: fetchError } = await supabase
      .from("product_variants")
      .select("product_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !variant) {
      throw new Error("Không tìm thấy phiên bản.");
    }

    const { error } = await supabase
      .from("product_variants")
      .update({
        name,
        price_cents: price,
        compare_at_price_cents: compare,
        is_free: price === 0,
        is_active: Boolean(input.is_active),
        requires_license: Boolean(input.requires_license),
        lemon_squeezy_variant_id: input.lemon_squeezy_variant_id?.trim() || null,
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update variant", error);
      throw new Error("Không thể lưu phiên bản. Vui lòng thử lại.");
    }

    await syncProductMirror(supabase, variant.product_id as string);
    revalidateProductSurfaces(variant.product_id as string);

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while updating variant", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function setDefaultVariant(
  variantId: string
): Promise<ProductVariantsActionResult> {
  try {
    await requireAdmin();

    const id = variantId.trim();

    if (!id) {
      throw new Error("Thiếu phiên bản.");
    }

    const supabase = await createClient();
    const { data: variant, error: fetchError } = await supabase
      .from("product_variants")
      .select("product_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !variant) {
      throw new Error("Không tìm thấy phiên bản.");
    }

    const productId = variant.product_id as string;

    await supabase
      .from("product_variants")
      .update({ is_default: false })
      .eq("product_id", productId);
    const { error } = await supabase
      .from("product_variants")
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      throw new Error("Không thể đặt phiên bản mặc định. Vui lòng thử lại.");
    }

    await syncProductMirror(supabase, productId);
    revalidateProductSurfaces(productId);

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while setting default variant", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function reorderVariants(
  productId: string,
  orderedIds: string[]
): Promise<ProductVariantsActionResult> {
  try {
    await requireAdmin();

    const id = productId.trim();

    if (!id) {
      throw new Error("Thiếu sản phẩm.");
    }

    const supabase = await createClient();

    for (let index = 0; index < orderedIds.length; index += 1) {
      const variantId = orderedIds[index]?.trim();

      if (!variantId) {
        continue;
      }

      const { error } = await supabase
        .from("product_variants")
        .update({ position: index })
        .eq("id", variantId)
        .eq("product_id", id);

      if (error) {
        throw new Error("Không thể sắp xếp phiên bản. Vui lòng thử lại.");
      }
    }

    revalidateProductSurfaces(id);
    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while reordering variants", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

// Deletes a variant. A product must keep at least one; deleting the default
// promotes another variant first.
export async function deleteVariant(
  variantId: string
): Promise<ProductVariantsActionResult> {
  try {
    await requireAdmin();

    const id = variantId.trim();

    if (!id) {
      throw new Error("Thiếu phiên bản.");
    }

    const supabase = await createClient();
    const { data: variant, error: fetchError } = await supabase
      .from("product_variants")
      .select("product_id, is_default")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !variant) {
      throw new Error("Không tìm thấy phiên bản.");
    }

    const productId = variant.product_id as string;
    const { data: siblings } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .neq("id", id)
      .order("position", { ascending: true });

    const others = (siblings ?? []) as { id: string }[];

    if (others.length === 0) {
      throw new Error("Sản phẩm phải có ít nhất một phiên bản.");
    }

    if (variant.is_default) {
      await supabase
        .from("product_variants")
        .update({ is_default: true })
        .eq("id", others[0].id);
    }

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete variant", error);
      throw new Error("Không thể xóa phiên bản. Vui lòng thử lại.");
    }

    await syncProductMirror(supabase, productId);
    revalidateProductSurfaces(productId);

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while deleting variant", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}
