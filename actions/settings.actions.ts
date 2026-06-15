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
  contact: {
    zalo: { url: string; icon: string };
    telegram: { url: string; icon: string };
    messenger: { url: string; icon: string };
    phone: { url: string; icon: string };
  };
  promo: {
    leftImage: string;
    leftHref: string;
    rightImage: string;
    rightHref: string;
  };
  socials: Array<{ label: string; url: string; iconUrl: string }>;
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
        {
          key: STORE_SETTINGS_KEYS.contact,
          value: {
            zalo: cleanText(input.contact.zalo.url),
            zalo_icon: cleanText(input.contact.zalo.icon),
            telegram: cleanText(input.contact.telegram.url),
            telegram_icon: cleanText(input.contact.telegram.icon),
            messenger: cleanText(input.contact.messenger.url),
            messenger_icon: cleanText(input.contact.messenger.icon),
            phone: cleanText(input.contact.phone.url),
            phone_icon: cleanText(input.contact.phone.icon),
          },
        },
        {
          key: STORE_SETTINGS_KEYS.promo,
          value: {
            left_image: cleanText(input.promo.leftImage),
            left_href: cleanText(input.promo.leftHref),
            right_image: cleanText(input.promo.rightImage),
            right_href: cleanText(input.promo.rightHref),
          },
        },
        {
          key: STORE_SETTINGS_KEYS.socials,
          value: {
            items: input.socials
              .map((item) => ({
                label: cleanText(item.label),
                url: cleanText(item.url),
                iconUrl: cleanText(item.iconUrl),
              }))
              .filter((item) => item.iconUrl && item.url),
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
