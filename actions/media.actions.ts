"use server";

import { randomUUID } from "node:crypto";

import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

const MEDIA_BUCKET = "media";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

type MediaFolder = "blog" | "products";

export type MediaUploadResult =
  | {
      ok: true;
      path: string;
      url: string;
    }
  | {
      ok: false;
      error: string;
    };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

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
      .replace(/^-+|-+$/g, "") || "image";

  return `${safeBasename}${extension.toLowerCase()}`;
}

function normalizeFolder(value: FormDataEntryValue | null): MediaFolder {
  if (value === "blog" || value === "products") {
    return value;
  }

  throw new Error("Media folder is invalid.");
}

function normalizeImageFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error("Image file is required.");
  }

  if (!allowedImageTypes.includes(value.type as (typeof allowedImageTypes)[number])) {
    throw new Error("Only JPG, PNG, WebP, GIF, and SVG images are allowed.");
  }

  if (value.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  return value;
}

async function ensureMediaBucket() {
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.storage.getBucket(MEDIA_BUCKET);

  if (!error) {
    await supabaseAdmin.storage.updateBucket(MEDIA_BUCKET, {
      allowedMimeTypes: [...allowedImageTypes],
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      public: true,
    });

    return supabaseAdmin;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(
    MEDIA_BUCKET,
    {
      allowedMimeTypes: [...allowedImageTypes],
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      public: true,
    }
  );

  if (createError) {
    throw createError;
  }

  return supabaseAdmin;
}

export async function uploadAdminImage(
  formData: FormData
): Promise<MediaUploadResult> {
  try {
    await requireAdmin();

    const folder = normalizeFolder(formData.get("folder"));
    const file = normalizeImageFile(formData.get("file"));
    const supabaseAdmin = await ensureMediaBucket();
    const filePath = `${folder}/${Date.now()}-${randomUUID()}-${sanitizeFileName(
      file.name
    )}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .upload(filePath, fileBuffer, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Failed to upload admin image", error);
      return { ok: false, error: "Không thể tải ảnh lên. Vui lòng thử lại." };
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);

    return {
      ok: true,
      path: filePath,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Unexpected error while uploading admin image", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}
