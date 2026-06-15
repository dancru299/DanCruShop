import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

export type VietQrSettings = {
  bankBin: string | null;
  accountNo: string | null;
  accountName: string | null;
  template: string;
  enabled: boolean;
};

export type StoreInfo = {
  storeName: string;
  supportEmail: string;
};

// Public contact channels rendered by the storefront floating contact widget.
// `url` is the href (null → button hidden); `icon` is an optional uploaded logo
// image (null → fall back to the built-in brand icon).
export type ContactChannel = { url: string | null; icon: string | null };

export type ContactSettings = {
  zalo: ContactChannel;
  telegram: ContactChannel;
  messenger: ContactChannel;
  phone: ContactChannel;
};

// Vertical promo banners that flank the storefront content on wide screens.
// Each side is an image + link; an empty image hides that rail.
export type PromoRail = { imageUrl: string | null; href: string | null };

export type PromoSettings = {
  leftRail: PromoRail;
  rightRail: PromoRail;
};

// Social / community links shown in the footer. Each has an uploaded logo image.
export type SocialLink = { label: string; url: string; iconUrl: string };

export type StoreSettings = {
  vietqr: VietQrSettings;
  store: StoreInfo;
  contact: ContactSettings;
  promo: PromoSettings;
  socials: SocialLink[];
};

export const STORE_SETTINGS_KEYS = {
  store: "store.info",
  vietqr: "payments.vietqr",
  contact: "contact.channels",
  promo: "promo.side_rails",
  socials: "social.links",
} as const;

const DEFAULT_VIETQR_TEMPLATE = "compact2";
const DEFAULT_STORE_NAME = "DanCruShop";
const DEFAULT_SUPPORT_EMAIL = "support@dancrushop.com";

type SettingsRecord = Record<string, unknown>;

function getString(record: SettingsRecord, key: string) {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getBoolean(record: SettingsRecord, key: string, fallback: boolean) {
  const value = record[key];

  return typeof value === "boolean" ? value : fallback;
}

async function loadSettingsRows(): Promise<Record<string, SettingsRecord>> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", [
        STORE_SETTINGS_KEYS.vietqr,
        STORE_SETTINGS_KEYS.store,
        STORE_SETTINGS_KEYS.contact,
        STORE_SETTINGS_KEYS.promo,
        STORE_SETTINGS_KEYS.socials,
      ]);

    if (error) {
      console.error("Failed to load app settings", error);
      return {};
    }

    const rows: Record<string, SettingsRecord> = {};

    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      rows[row.key] =
        row.value && typeof row.value === "object"
          ? (row.value as SettingsRecord)
          : {};
    }

    return rows;
  } catch (error) {
    // Missing service-role env (e.g. during build) → fall back to env only.
    console.error("Unexpected error while loading app settings", error);
    return {};
  }
}

function resolveVietQrSettings(record: SettingsRecord): VietQrSettings {
  const bankBin =
    getString(record, "bank_bin") ?? process.env.VIETQR_BANK_BIN?.trim() ?? null;
  const accountNo =
    getString(record, "account_no") ??
    process.env.VIETQR_ACCOUNT_NO?.trim() ??
    null;
  const accountName =
    getString(record, "account_name") ??
    process.env.VIETQR_ACCOUNT_NAME?.trim() ??
    null;
  const template =
    getString(record, "template") ??
    process.env.VIETQR_TEMPLATE?.trim() ??
    DEFAULT_VIETQR_TEMPLATE;

  return {
    accountName,
    accountNo,
    bankBin,
    enabled: getBoolean(record, "enabled", true),
    template,
  };
}

function resolveStoreInfo(record: SettingsRecord): StoreInfo {
  return {
    storeName:
      getString(record, "store_name") ??
      process.env.NEXT_PUBLIC_STORE_NAME?.trim() ??
      DEFAULT_STORE_NAME,
    supportEmail:
      getString(record, "support_email") ??
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ??
      DEFAULT_SUPPORT_EMAIL,
  };
}

function resolveChannel(
  record: SettingsRecord,
  urlKey: string,
  iconKey: string
): ContactChannel {
  return {
    url: getString(record, urlKey),
    icon: getString(record, iconKey),
  };
}

function resolveContactSettings(record: SettingsRecord): ContactSettings {
  return {
    zalo: resolveChannel(record, "zalo", "zalo_icon"),
    telegram: resolveChannel(record, "telegram", "telegram_icon"),
    messenger: resolveChannel(record, "messenger", "messenger_icon"),
    phone: resolveChannel(record, "phone", "phone_icon"),
  };
}

function resolveSocials(value: unknown): SocialLink[] {
  const items = (value as { items?: unknown } | null)?.items;

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const record = (item ?? {}) as SettingsRecord;
      return {
        label: getString(record, "label") ?? "",
        url: getString(record, "url") ?? "",
        iconUrl: getString(record, "iconUrl") ?? "",
      };
    })
    .filter((item) => item.iconUrl.length > 0 && item.url.length > 0);
}

function resolvePromoSettings(record: SettingsRecord): PromoSettings {
  return {
    leftRail: {
      imageUrl: getString(record, "left_image"),
      href: getString(record, "left_href"),
    },
    rightRail: {
      imageUrl: getString(record, "right_image"),
      href: getString(record, "right_href"),
    },
  };
}

/**
 * Public-facing store config that admins can override from /admin/settings.
 * Reads the app_settings table via the service role and falls back to env vars
 * (and finally hard defaults) for any key that has not been set yet.
 * Memoized per request with React cache().
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await loadSettingsRows();

  return {
    store: resolveStoreInfo(rows[STORE_SETTINGS_KEYS.store] ?? {}),
    vietqr: resolveVietQrSettings(rows[STORE_SETTINGS_KEYS.vietqr] ?? {}),
    contact: resolveContactSettings(rows[STORE_SETTINGS_KEYS.contact] ?? {}),
    promo: resolvePromoSettings(rows[STORE_SETTINGS_KEYS.promo] ?? {}),
    socials: resolveSocials(rows[STORE_SETTINGS_KEYS.socials] ?? {}),
  };
});

export function hasAnyContactChannel(settings: ContactSettings) {
  return Boolean(
    settings.zalo.url ||
      settings.telegram.url ||
      settings.messenger.url ||
      settings.phone.url
  );
}

export function isVietQrConfigured(settings: VietQrSettings) {
  return Boolean(settings.enabled && settings.bankBin && settings.accountNo);
}
