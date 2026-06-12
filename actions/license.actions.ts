"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import type { LicenseStatus } from "@/lib/supabase/queries/licenses";
import { createClient } from "@/lib/supabase/server";

export type LicenseActionResult = { ok: true } | { ok: false; error: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function setLicenseStatus(
  id: string,
  status: LicenseStatus
): Promise<LicenseActionResult> {
  try {
    await requireAdmin();

    const licenseId = id.trim();

    if (!licenseId) {
      throw new Error("License id is required.");
    }

    if (status !== "active" && status !== "revoked") {
      throw new Error("Invalid license status.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("license_keys")
      .update({
        revoked_at: status === "revoked" ? new Date().toISOString() : null,
        status,
      })
      .eq("id", licenseId);

    if (error) {
      console.error("Failed to update license status", error);
      return { error: error.message, ok: false };
    }

    revalidatePath("/admin/licenses");

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while updating license status", error);
    return { error: getErrorMessage(error), ok: false };
  }
}
