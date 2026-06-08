"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error: string | null;
  success: string | null;
};

export type AvatarUploadResult =
  | {
      ok: true;
      url: string;
    }
  | {
      error: string;
      ok: false;
    };

const AVATAR_BUCKET = "media";
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
const allowedAvatarTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
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
      .replace(/^-+|-+$/g, "") || "avatar";

  return `${safeBasename}${extension.toLowerCase()}`;
}

function normalizeAvatarFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error("Avatar image is required.");
  }

  if (!allowedAvatarTypes.includes(value.type as (typeof allowedAvatarTypes)[number])) {
    throw new Error("Only JPG, PNG, WebP, and GIF avatars are allowed.");
  }

  if (value.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("Avatar must be 3MB or smaller.");
  }

  return value;
}

async function ensureAvatarBucket() {
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.storage.getBucket(AVATAR_BUCKET);

  if (!error) {
    await supabaseAdmin.storage.updateBucket(AVATAR_BUCKET, {
      public: true,
    });

    return supabaseAdmin;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(
    AVATAR_BUCKET,
    {
      allowedMimeTypes: [...allowedAvatarTypes],
      fileSizeLimit: MAX_AVATAR_SIZE_BYTES,
      public: true,
    }
  );

  if (createError) {
    throw createError;
  }

  return supabaseAdmin;
}

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fullName = getOptionalString(formData, "fullName");

  if (fullName.length > 80) {
    return {
      error: "Tên phải có tối đa 80 ký tự.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Vui lòng đăng nhập trước khi cập nhật hồ sơ.",
        success: null,
      };
    }

    const { error } = await supabase.from("profiles").upsert({
      full_name: fullName || null,
      id: user.id,
    });

    if (error) {
      console.error("Failed to update profile", error);

      return {
        error: "Hiện không thể cập nhật hồ sơ.",
        success: null,
      };
    }

    revalidatePath("/");
    revalidatePath("/profile");

    return {
      error: null,
      success: "Đã cập nhật hồ sơ.",
    };
  } catch (error) {
    console.error("Unexpected error while updating profile", error);

    return {
      error: "Hiện không thể cập nhật hồ sơ.",
      success: null,
    };
  }
}

export async function uploadProfileAvatar(
  formData: FormData
): Promise<AvatarUploadResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Vui lòng đăng nhập trước khi tải ảnh đại diện.",
        ok: false,
      };
    }

    const file = normalizeAvatarFile(formData.get("file"));
    const supabaseAdmin = await ensureAvatarBucket();
    const filePath = `avatars/${user.id}/${Date.now()}-${randomUUID()}-${sanitizeFileName(
      file.name
    )}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, fileBuffer, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Failed to upload profile avatar", uploadError);

      return {
        error: uploadError.message,
        ok: false,
      };
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    const { error: profileError } = await supabase.from("profiles").upsert({
      avatar_url: publicUrl,
      id: user.id,
    });

    if (profileError) {
      console.error("Failed to update profile avatar", profileError);

      return {
        error: "Đã tải ảnh lên nhưng chưa thể cập nhật hồ sơ.",
        ok: false,
      };
    }

    revalidatePath("/");
    revalidatePath("/profile");

    return {
      ok: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Unexpected error while uploading profile avatar", error);

    return {
      error: getErrorMessage(error),
      ok: false,
    };
  }
}
