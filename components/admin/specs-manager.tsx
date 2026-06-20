"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteSpecGroup,
  deleteSpecField,
  deleteSpecOption,
  reorderSpecGroup,
} from "@/actions/specs.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GroupDialog, FieldDialog, OptionDialog } from "@/components/admin/specs-dialogs";

type SpecGroupRow = {
  id: string;
  label: string;
  label_en: string;
  kind: "tech" | "meta";
  sort_order: number;
  fields?: SpecFieldRow[];
};

type SpecFieldRow = {
  id: string;
  key: string;
  label: string;
  label_en: string;
  type: "single" | "multi" | "boolean";
  hint: string | null;
  sort_order: number;
  options?: SpecOptionRow[];
};

type SpecOptionRow = {
  id: string;
  value: string;
  label: string;
  label_en: string | null;
  class_name: string | null;
  logo: string | null;
  sort_order: number;
  is_active: boolean;
};

type SpecsManagerProps = {
  groups: SpecGroupRow[];
  totalFields: number;
  totalOptions: number;
};

export function SpecsManager({ groups, totalFields, totalOptions }: SpecsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.slice(0, 1).map((g) => g.id))
  );
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const [groupDialog, setGroupDialog] = useState<{ open: boolean; group?: SpecGroupRow }>({ open: false });
  const [fieldDialog, setFieldDialog] = useState<{ open: boolean; field?: SpecFieldRow; groupId: string; nextSort: number }>({ open: false, groupId: "", nextSort: 0 });
  const [optionDialog, setOptionDialog] = useState<{ open: boolean; option?: SpecOptionRow; fieldId: string; nextSort: number }>({ open: false, fieldId: "", nextSort: 0 });

  function toggleGroup(id: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleField(id: string) {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleDeleteGroup(group: SpecGroupRow) {
    if (!window.confirm(`Xóa nhóm "${group.label}" và tất cả field, option bên trong?`)) return;
    startTransition(async () => {
      const result = await deleteSpecGroup(group.id);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Đã xóa nhóm.");
      router.refresh();
    });
  }

  function handleDeleteField(field: SpecFieldRow) {
    if (!window.confirm(`Xóa field "${field.label}" và tất cả option bên trong?`)) return;
    startTransition(async () => {
      const result = await deleteSpecField(field.id);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Đã xóa field.");
      router.refresh();
    });
  }

  function handleDeleteOption(option: SpecOptionRow) {
    if (!window.confirm(`Xóa option "${option.label}"?`)) return;
    startTransition(async () => {
      const result = await deleteSpecOption(option.id);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Đã xóa option.");
      router.refresh();
    });
  }

  function handleReorderGroup(group: SpecGroupRow, direction: "up" | "down") {
    startTransition(async () => {
      await reorderSpecGroup(group.id, direction);
      router.refresh();
    });
  }

  const groupOrderIdx = new Map(groups.map((g, i) => [g.id, i]));

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Tổng nhóm</p>
          <p className="mt-1 text-2xl font-semibold">{groups.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Tổng field</p>
          <p className="mt-1 text-2xl font-semibold">{totalFields}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Tổng option</p>
          <p className="mt-1 text-2xl font-semibold">{totalOptions}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border bg-card p-8 text-center">
          <SlidersHorizontalIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Chưa có nhóm thông số nào</p>
          <Button variant="outline" size="sm" onClick={() => setGroupDialog({ open: true })} disabled={isPending}>
            <PlusIcon data-icon="inline-start" />Thêm nhóm đầu tiên
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const gIdx = groupOrderIdx.get(group.id) ?? 0;

            return (
              <div key={group.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-2 p-4">
                  <div className="flex flex-col">
                    <Button variant="ghost" size="icon-xs" aria-label="Lên" disabled={isPending || gIdx === 0}
                      onClick={() => handleReorderGroup(group, "up")}>
                      <ChevronUpIcon className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" aria-label="Xuống" disabled={isPending || gIdx === groups.length - 1}
                      onClick={() => handleReorderGroup(group, "down")}>
                      <ChevronDownIcon className="size-3.5" />
                    </Button>
                  </div>

                  <button type="button" onClick={() => toggleGroup(group.id)} className="flex flex-1 items-center gap-3 text-left">
                    {isExpanded ? <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" /> : <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />}
                    <span className="text-sm font-medium">{group.label}</span>
                    <Badge variant="secondary">{group.kind}</Badge>
                    <span className="text-xs text-muted-foreground">{group.fields?.length ?? 0} field</span>
                  </button>

                  <Button variant="ghost" size="icon-sm" aria-label="Sửa nhóm" disabled={isPending}
                    onClick={() => setGroupDialog({ open: true, group })}>
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Xóa nhóm" disabled={isPending}
                    onClick={() => handleDeleteGroup(group)}>
                    <Trash2Icon className="size-3.5 text-destructive" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="border-t">
                    {(group.fields ?? []).map((field) => {
                      const fExpanded = expandedFields.has(field.id);
                      return (
                        <div key={field.id} className="border-b last:border-b-0">
                          <div className="flex items-center gap-2 px-4 py-2.5 pl-10">
                            <button type="button" onClick={() => toggleField(field.id)} className="flex flex-1 items-center gap-3 text-left">
                              {fExpanded ? <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronUpIcon className="size-3.5 shrink-0 text-muted-foreground" />}
                              <span className="text-sm">{field.label}</span>
                              <Badge variant="outline" className="text-[10px]">{field.type}</Badge>
                            </button>
                            <Button variant="ghost" size="icon-xs" aria-label="Sửa field" disabled={isPending}
                              onClick={() => setFieldDialog({ open: true, field, groupId: group.id, nextSort: (field.options?.length ?? 0) })}>
                              <PencilIcon className="size-3" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" aria-label="Xóa field" disabled={isPending}
                              onClick={() => handleDeleteField(field)}>
                              <Trash2Icon className="size-3 text-destructive" />
                            </Button>
                          </div>

                          {fExpanded && (
                            <div className="border-t bg-muted/20">
                              {(field.options ?? []).map((option) => (
                                <div key={option.id} className="flex items-center gap-2 border-b border-border/50 px-4 py-2 pl-14 last:border-b-0">
                                  <span className="flex-1 text-sm">{option.label}</span>
                                  {option.logo ? <span className="text-xs text-muted-foreground">{option.logo}</span> : null}
                                  {!option.is_active ? <Badge variant="outline" className="text-[10px]">Ẩn</Badge> : null}
                                  {option.class_name ? (
                                    <span className={cn("inline-flex h-3 w-3 rounded-full border", option.class_name)} />
                                  ) : null}
                                  <Button variant="ghost" size="icon-xs" aria-label="Sửa option" disabled={isPending}
                                    onClick={() => setOptionDialog({ open: true, option, fieldId: field.id, nextSort: (field.options?.length ?? 0) })}>
                                    <PencilIcon className="size-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon-xs" aria-label="Xóa option" disabled={isPending}
                                    onClick={() => handleDeleteOption(option)}>
                                    <Trash2Icon className="size-3 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                              <div className="px-4 py-2 pl-14">
                                <Button variant="outline" size="sm" disabled={isPending}
                                  onClick={() => setOptionDialog({ open: true, fieldId: field.id, nextSort: (field.options?.length ?? 0) + 1 })}>
                                  <PlusIcon data-icon="inline-start" />Thêm option
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="px-4 py-3 pl-10">
                      <Button variant="outline" size="sm" disabled={isPending}
                        onClick={() => setFieldDialog({ open: true, groupId: group.id, nextSort: (group.fields?.length ?? 0) + 1 })}>
                        <PlusIcon data-icon="inline-start" />Thêm field
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <GroupDialog open={groupDialog.open} onClose={() => setGroupDialog({ open: false })} group={groupDialog.group} />
      <FieldDialog open={fieldDialog.open} onClose={() => setFieldDialog({ open: false, groupId: "", nextSort: 0 })} field={fieldDialog.field} groupId={fieldDialog.groupId} nextSortOrder={fieldDialog.nextSort} />
      <OptionDialog open={optionDialog.open} onClose={() => setOptionDialog({ open: false, fieldId: "", nextSort: 0 })} option={optionDialog.option} fieldId={optionDialog.fieldId} nextSortOrder={optionDialog.nextSort} />
    </div>
  );
}
