"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type BundleActionResult = { ok: true } | { ok: false; error: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function setBundleItems(
  bundleId: string,
  childIds: string[]
): Promise<BundleActionResult> {
  try {
    await requireAdmin();

    const normalizedBundleId = bundleId.trim();

    if (!normalizedBundleId) {
      throw new Error("Bundle id is required.");
    }

    const uniqueChildIds = Array.from(
      new Set(childIds.map((id) => id.trim()).filter((id) => id.length > 0))
    ).filter((id) => id !== normalizedBundleId);

    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("bundle_items")
      .delete()
      .eq("bundle_product_id", normalizedBundleId);

    if (deleteError) {
      console.error("Failed to reset bundle", deleteError);
      throw new Error("Không thể đặt lại bundle. Vui lòng thử lại.");
    }

    if (uniqueChildIds.length > 0) {
      const { error: insertError } = await supabase.from("bundle_items").insert(
        uniqueChildIds.map((childId, index) => ({
          bundle_product_id: normalizedBundleId,
          child_product_id: childId,
          position: index,
        }))
      );

      if (insertError) {
        console.error("Failed to save bundle items", insertError);
        throw new Error("Không thể lưu bundle. Vui lòng thử lại.");
      }
    }

    revalidatePath(`/admin/products/${normalizedBundleId}/bundle`);
    revalidatePath("/products");

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while setting bundle items", error);
    return { error: getErrorMessage(error), ok: false };
  }
}
