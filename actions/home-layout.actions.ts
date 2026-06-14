"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import {
  HOME_LAYOUT_KEY,
  normalizeLayout,
  type HomeSection,
} from "@/lib/store/home-layout";
import { createClient } from "@/lib/supabase/server";

export type HomeLayoutActionResult =
  | { ok: true }
  | { ok: false; error: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function updateHomeLayout(
  sections: HomeSection[]
): Promise<HomeLayoutActionResult> {
  try {
    await requireAdmin();

    // Re-normalize on the server so a malformed payload can never be persisted.
    const normalized = normalizeLayout(sections);

    const supabase = await createClient();
    const { error } = await supabase.from("app_settings").upsert(
      {
        key: HOME_LAYOUT_KEY,
        value: { sections: normalized },
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error("Failed to update home layout", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin/home");

    return { ok: true };
  } catch (error) {
    console.error("Unexpected error while updating home layout", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}
