"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProductFileRecord = {
  id: string;
  product_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  file_type: string | null;
  version: string | null;
  is_primary: boolean;
  download_count: number;
  max_downloads_per_user: number | null;
  created_at: string;
};

type AddProductFileInput = {
  productId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
};

type ProductFileActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function normalizeText(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function normalizeFileSize(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("File size must be greater than or equal to 0.");
  }

  return Math.round(value);
}

function assertProductFilePath(productId: string, filePath: string) {
  if (!filePath.startsWith(`${productId}/`)) {
    throw new Error("File path does not match this product.");
  }
}

function revalidateProductFiles(productId: string) {
  revalidatePath(`/admin/products/${productId}/files`);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function addProductFile(
  data: AddProductFileInput
): Promise<ProductFileActionResult> {
  try {
    await requireAdmin();

    const productId = normalizeText(data.productId, "Product id");
    const fileName = normalizeText(data.fileName, "File name");
    const filePath = normalizeText(data.filePath, "File path");
    const fileSize = normalizeFileSize(data.fileSize);
    const fileType = data.fileType.trim() || "application/octet-stream";

    assertProductFilePath(productId, filePath);

    const supabase = await createClient();
    const { count, error: countError } = await supabase
      .from("product_files")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if (countError) {
      console.error("Failed to count product files", countError);
      return { ok: false, error: "Không thể tải danh sách tệp. Vui lòng thử lại." };
    }

    const { error } = await supabase.from("product_files").insert({
      file_name: fileName,
      file_path: filePath,
      file_size_bytes: fileSize,
      file_type: fileType,
      is_primary: (count ?? 0) === 0,
      product_id: productId,
    });

    if (error) {
      console.error("Failed to add product file record", error);
      return { ok: false, error: "Không thể thêm tệp. Vui lòng thử lại." };
    }

    revalidateProductFiles(productId);

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while adding product file", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function deleteProductFile(
  fileId: string,
  filePath: string
): Promise<ProductFileActionResult> {
  try {
    await requireAdmin();

    const normalizedFileId = normalizeText(fileId, "File id");
    const normalizedFilePath = normalizeText(filePath, "File path");
    const supabaseAdmin = createAdminClient();
    const { data: fileRecord, error: loadError } = await supabaseAdmin
      .from("product_files")
      .select("id, product_id, is_primary")
      .eq("id", normalizedFileId)
      .maybeSingle();

    if (loadError) {
      console.error("Failed to load product file before delete", loadError);
      return { ok: false, error: "Không thể tải tệp. Vui lòng thử lại." };
    }

    if (!fileRecord) {
      return { ok: false, error: "File record was not found." };
    }

    const productId = String(fileRecord.product_id);
    assertProductFilePath(productId, normalizedFilePath);

    const { error: storageError } = await supabaseAdmin.storage
      .from("products")
      .remove([normalizedFilePath]);

    if (storageError) {
      console.error("Failed to delete product file from storage", storageError);
      return { ok: false, error: "Không thể xóa tệp khỏi kho lưu trữ. Vui lòng thử lại." };
    }

    const { error: deleteError } = await supabaseAdmin
      .from("product_files")
      .delete()
      .eq("id", normalizedFileId);

    if (deleteError) {
      console.error("Failed to delete product file record", deleteError);
      return { ok: false, error: "Không thể xóa tệp. Vui lòng thử lại." };
    }

    if (fileRecord.is_primary) {
      const { data: nextPrimary, error: nextPrimaryError } = await supabaseAdmin
        .from("product_files")
        .select("id")
        .eq("product_id", productId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextPrimaryError) {
        console.error("Failed to load replacement primary file", nextPrimaryError);
        return { ok: false, error: "Không thể cập nhật tệp chính. Vui lòng thử lại." };
      }

      if (nextPrimary) {
        const { error: updateError } = await supabaseAdmin
          .from("product_files")
          .update({ is_primary: true })
          .eq("id", String(nextPrimary.id));

        if (updateError) {
          console.error("Failed to promote replacement primary file", updateError);
          return { ok: false, error: "Không thể cập nhật tệp chính. Vui lòng thử lại." };
        }
      }
    }

    revalidateProductFiles(productId);

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while deleting product file", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getProductFiles(
  productId: string
): Promise<ProductFileRecord[]> {
  try {
    await requireAdmin();

    const normalizedProductId = normalizeText(productId, "Product id");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_files")
      .select(
        `
          id,
          product_id,
          file_name,
          file_path,
          file_size_bytes,
          file_type,
          version,
          is_primary,
          download_count,
          max_downloads_per_user,
          created_at
        `
      )
      .eq("product_id", normalizedProductId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch product files", error);
      return [];
    }

    return (data ?? []) as ProductFileRecord[];
  } catch (error) {
    console.error("Unexpected error while fetching product files", error);
    return [];
  }
}

export async function updateProductFileLimit(
  fileId: string,
  maxDownloads: number | null
): Promise<ProductFileActionResult> {
  try {
    await requireAdmin();

    const normalizedFileId = normalizeText(fileId, "File id");

    if (
      maxDownloads !== null &&
      (!Number.isInteger(maxDownloads) || maxDownloads < 1)
    ) {
      return { ok: false, error: "Limit must be a positive integer or empty (no limit)." };
    }

    const supabaseAdmin = createAdminClient();
    const { data: fileRecord, error: loadError } = await supabaseAdmin
      .from("product_files")
      .select("product_id")
      .eq("id", normalizedFileId)
      .maybeSingle();

    if (loadError || !fileRecord) {
      return { ok: false, error: "File not found." };
    }

    const { error } = await supabaseAdmin
      .from("product_files")
      .update({ max_downloads_per_user: maxDownloads })
      .eq("id", normalizedFileId);

    if (error) {
      console.error("Failed to update file download limit", error);
      return { ok: false, error: "Không thể cập nhật giới hạn tải. Vui lòng thử lại." };
    }

    revalidateProductFiles(String(fileRecord.product_id));

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while updating file limit", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}
