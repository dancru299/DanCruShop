"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function getError(error: unknown): string {
  return error instanceof Error ? error.message : "Có lỗi xảy ra.";
}

// ─── Groups ────────────────────────────────────────────────────────────

export type SpecGroupInput = {
  label: string;
  label_en: string;
  kind: "tech" | "meta";
  sort_order: number;
};

export async function createSpecGroup(
  input: SpecGroupInput
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("spec_groups")
      .insert({
        label: input.label.trim(),
        label_en: input.label_en.trim(),
        kind: input.kind,
        sort_order: input.sort_order,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

export async function updateSpecGroup(
  id: string,
  input: Partial<SpecGroupInput>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("spec_groups")
      .update({
        label: input.label?.trim(),
        label_en: input.label_en?.trim(),
        kind: input.kind,
        sort_order: input.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

export async function deleteSpecGroup(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("spec_groups")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

// ─── Fields ────────────────────────────────────────────────────────────

export type SpecFieldInput = {
  key: string;
  label: string;
  label_en: string;
  type: "single" | "multi" | "boolean";
  hint?: string | null;
  group_id: string;
  sort_order: number;
};

export async function createSpecField(
  input: SpecFieldInput
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("spec_fields")
      .insert({
        key: input.key.trim(),
        label: input.label.trim(),
        label_en: input.label_en.trim(),
        type: input.type,
        hint: input.hint?.trim() || null,
        group_id: input.group_id,
        sort_order: input.sort_order,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

export async function updateSpecField(
  id: string,
  input: Partial<SpecFieldInput>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("spec_fields")
      .update({
        key: input.key?.trim(),
        label: input.label?.trim(),
        label_en: input.label_en?.trim(),
        type: input.type,
        hint: input.hint?.trim(),
        group_id: input.group_id,
        sort_order: input.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

export async function deleteSpecField(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("spec_fields")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

// ─── Options ───────────────────────────────────────────────────────────

export type SpecOptionInput = {
  value: string;
  label: string;
  label_en?: string | null;
  class_name?: string | null;
  logo?: string | null;
  field_id: string;
  sort_order: number;
  is_active?: boolean;
};

export async function createSpecOption(
  input: SpecOptionInput
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("spec_options")
      .insert({
        value: input.value.trim(),
        label: input.label.trim(),
        label_en: input.label_en?.trim() || null,
        class_name: input.class_name?.trim() || null,
        logo: input.logo?.trim() || null,
        field_id: input.field_id,
        sort_order: input.sort_order,
        is_active: input.is_active ?? true,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

export async function updateSpecOption(
  id: string,
  input: Partial<SpecOptionInput>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("spec_options")
      .update({
        value: input.value?.trim(),
        label: input.label?.trim(),
        label_en: input.label_en?.trim(),
        class_name: input.class_name?.trim(),
        logo: input.logo?.trim(),
        field_id: input.field_id,
        sort_order: input.sort_order,
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

export async function deleteSpecOption(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("spec_options")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/specs");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}

// ─── Reorder ───────────────────────────────────────────────────────────

export async function reorderSpecGroup(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: groups } = await supabase
      .from("spec_groups")
      .select("id, sort_order")
      .order("sort_order");

    if (!groups || groups.length < 2) return { ok: true, id };

    const idx = groups.findIndex((g) => g.id === id);
    if (idx < 0) return { ok: true, id };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= groups.length) return { ok: true, id };

    await supabase
      .from("spec_groups")
      .update({ sort_order: groups[swapIdx].sort_order, updated_at: new Date().toISOString() })
      .eq("id", groups[idx].id);

    await supabase
      .from("spec_groups")
      .update({ sort_order: groups[idx].sort_order, updated_at: new Date().toISOString() })
      .eq("id", groups[swapIdx].id);

    revalidatePath("/admin/specs");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: getError(e) };
  }
}
