import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_LAYOUT,
  HOME_LAYOUT_KEY,
  normalizeLayout,
  type HomeSection,
} from "@/lib/store/home-layout";

/**
 * Reads the admin-authored homepage layout from app_settings (key `home.layout`)
 * via the service role, normalizing defensively and falling back to the default
 * layout when unset. Memoized per request with React cache().
 */
export const getHomeLayout = cache(async (): Promise<HomeSection[]> => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", HOME_LAYOUT_KEY)
      .maybeSingle();

    if (error) {
      console.error("Failed to load home layout", error);
      return DEFAULT_LAYOUT;
    }

    const value = (data?.value as { sections?: unknown } | null)?.sections;

    return normalizeLayout(value);
  } catch (error) {
    // Missing service-role env (e.g. during build) → render defaults.
    console.error("Unexpected error while loading home layout", error);
    return DEFAULT_LAYOUT;
  }
});
