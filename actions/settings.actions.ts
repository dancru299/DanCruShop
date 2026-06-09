"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { STORE_SETTINGS_KEYS } from "@/lib/store/settings";
import { createClient } from "@/lib/supabase/server";

export type StoreSettingsInput = {
  vietqr: {
    bankBin: string;
    accountNo: string;
    accountName: string;
    template: string;
    enabled: boolean;
  };
  store: {
    storeName: string;
    supportEmail: string;
  };
};

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function cleanText(value: string | undefined | null) {
  return value?.trim() ?? "";
}

export async function updateStoreSettings(
  input: StoreSettingsInput
): Promise<SettingsActionResult> {
  try {
    await requireAdmin();

    const email = cleanText(input.store.supportEmail);

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Support email không hợp lệ.");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("app_settings").upsert(
      [
        {
          key: STORE_SETTINGS_KEYS.vietqr,
          value: {
            account_name: cleanText(input.vietqr.accountName),
            account_no: cleanText(input.vietqr.accountNo),
            bank_bin: cleanText(input.vietqr.bankBin),
            enabled: Boolean(input.vietqr.enabled),
            template: cleanText(input.vietqr.template) || "compact2",
          },
        },
        {
          key: STORE_SETTINGS_KEYS.store,
          value: {
            store_name: cleanText(input.store.storeName),
            support_email: email,
          },
        },
      ],
      { onConflict: "key" }
    );

    if (error) {
      console.error("Failed to update store settings", error);
      return { error: error.message, ok: false };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while updating store settings", error);
    return { error: getErrorMessage(error), ok: false };
  }
}
