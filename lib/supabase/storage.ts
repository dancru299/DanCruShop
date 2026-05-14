import { createClient } from "@/lib/supabase/client";

export type ProductFileUploadResult = {
  fullPath: string | null;
  path: string;
};

function sanitizeFileName(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");
  const basename =
    extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : "";
  const safeBasename =
    basename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file";

  return `${safeBasename}${extension.toLowerCase()}`;
}

export async function uploadProductFile(file: File, productId: string) {
  const normalizedProductId = productId.trim();

  if (!normalizedProductId) {
    throw new Error("Product id is required.");
  }

  if (!file) {
    throw new Error("File is required.");
  }

  const supabase = createClient();
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const filePath = `${normalizedProductId}/${fileName}`;
  const { data, error } = await supabase.storage
    .from("products")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    fullPath: data.fullPath,
    path: data.path,
  } satisfies ProductFileUploadResult;
}
