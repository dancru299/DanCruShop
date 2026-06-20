import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  SPEC_GROUPS,
  type SpecFieldType,
  type SpecGroup,
  type SpecField,
  type SpecOption,
} from "@/lib/products/specs";

export type SpecOptionRow = {
  id: string;
  value: string;
  label: string;
  label_en: string | null;
  class_name: string | null;
  logo: string | null;
  field_id: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SpecFieldRow = {
  id: string;
  key: string;
  label: string;
  label_en: string;
  type: SpecFieldType;
  hint: string | null;
  group_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  options?: SpecOptionRow[];
};

export type SpecGroupRow = {
  id: string;
  label: string;
  label_en: string;
  kind: "tech" | "meta";
  sort_order: number;
  created_at: string;
  updated_at: string;
  fields?: SpecFieldRow[];
};

export async function getAdminSpecGroups(): Promise<SpecGroupRow[]> {
  const supabase = createAdminClient();

  const { data: groups, error: groupError } = await supabase
    .from("spec_groups")
    .select("*")
    .order("sort_order");

  if (groupError) {
    console.error("Failed to fetch spec groups", groupError);
    return [];
  }

  const { data: fields, error: fieldError } = await supabase
    .from("spec_fields")
    .select("*")
    .order("sort_order");

  if (fieldError) {
    console.error("Failed to fetch spec fields", fieldError);
    return [];
  }

  const { data: options, error: optionError } = await supabase
    .from("spec_options")
    .select("*")
    .order("sort_order");

  if (optionError) {
    console.error("Failed to fetch spec options", optionError);
    return [];
  }

  const fieldByGroupId = new Map<string, SpecFieldRow[]>();
  for (const f of fields as SpecFieldRow[]) {
    const list = fieldByGroupId.get(f.group_id) ?? [];
    list.push(f);
    fieldByGroupId.set(f.group_id, list);
  }

  const optionByFieldId = new Map<string, SpecOptionRow[]>();
  for (const o of options as SpecOptionRow[]) {
    const list = optionByFieldId.get(o.field_id) ?? [];
    list.push(o);
    optionByFieldId.set(o.field_id, list);
  }

  return (groups as SpecGroupRow[]).map((group) => {
    const groupFields = (fieldByGroupId.get(group.id) ?? []).map((field) => ({
      ...field,
      options: optionByFieldId.get(field.id) ?? [],
    }));
    return { ...group, fields: groupFields };
  });
}

export async function getPublicSpecGroups(): Promise<SpecGroupRow[]> {
  const supabase = await createClient();

  const { data: groups, error: groupError } = await supabase
    .from("spec_groups")
    .select("*")
    .order("sort_order");

  if (groupError || !groups) return [];

  const { data: fields } = await supabase
    .from("spec_fields")
    .select("*")
    .order("sort_order");

  const { data: options } = await supabase
    .from("spec_options")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const fieldByGroupId = new Map<string, SpecFieldRow[]>();
  for (const f of (fields ?? []) as SpecFieldRow[]) {
    const list = fieldByGroupId.get(f.group_id) ?? [];
    list.push(f);
    fieldByGroupId.set(f.group_id, list);
  }

  const optionByFieldId = new Map<string, SpecOptionRow[]>();
  for (const o of (options ?? []) as SpecOptionRow[]) {
    const list = optionByFieldId.get(o.field_id) ?? [];
    list.push(o);
    optionByFieldId.set(o.field_id, list);
  }

  return (groups as SpecGroupRow[]).map((group) => {
    const groupFields = (fieldByGroupId.get(group.id) ?? []).map((field) => ({
      ...field,
      options: (optionByFieldId.get(field.id) ?? []).filter((o) => o.is_active),
    }));
    return { ...group, fields: groupFields };
  });
}

export async function getSpecGroupById(id: string): Promise<SpecGroupRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("spec_groups")
    .select("*, fields:spec_fields(*, options:spec_options(*))")
    .eq("id", id)
    .order("sort_order", { referencedTable: "spec_fields" })
    .order("sort_order", { referencedTable: "spec_fields.options" })
    .maybeSingle();
  return (data as SpecGroupRow | null) ?? null;
}

// ─── DB-backed fetch wrappers (Server-side only) ───

function mapOption(row: SpecOptionRow): SpecOption {
  return {
    value: row.value,
    label: row.label,
    labelEn: row.label_en ?? undefined,
    className: row.class_name ?? undefined,
    logo: row.logo ?? undefined,
  };
}

function mapField(row: SpecFieldRow): SpecField {
  return {
    key: row.key,
    label: row.label,
    labelEn: row.label_en,
    type: row.type,
    hint: row.hint ?? undefined,
    options: (row.options ?? []).map(mapOption),
  };
}

function mapGroup(row: SpecGroupRow): SpecGroup {
  return {
    id: row.id,
    label: row.label,
    labelEn: row.label_en,
    kind: row.kind,
    fields: (row.fields ?? []).map(mapField),
  };
}

function mapGroups(rows: SpecGroupRow[]): SpecGroup[] {
  return rows.map(mapGroup);
}

export const getSpecGroupsFromDB = cache(async (): Promise<SpecGroup[]> => {
  try {
    const groups = await getPublicSpecGroups();
    if (groups.length > 0) return mapGroups(groups);
  } catch (e) {
    console.warn("Failed to fetch specs from DB, using fallback", e);
  }
  return SPEC_GROUPS;
});

export const getAdminSpecGroupsFromDB = cache(async (): Promise<SpecGroup[]> => {
  try {
    const groups = await getAdminSpecGroups();
    if (groups.length > 0) return mapGroups(groups);
  } catch (e) {
    console.warn("Failed to fetch admin specs from DB, using fallback", e);
  }
  return SPEC_GROUPS;
});
