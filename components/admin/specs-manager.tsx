"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  SlidersHorizontalIcon,
  TagIcon,
  LayersIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteSpecGroup,
  deleteSpecField,
  deleteSpecOption,
  reorderSpecGroup,
} from "@/actions/specs.actions";
import { deleteCategory, moveCategory } from "@/actions/category.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GroupDialog, FieldDialog, OptionDialog } from "@/components/admin/specs-dialogs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { AdminCategory } from "@/lib/supabase/queries/categories";

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
  categories: AdminCategory[];
  totalProducts: number;
  emptyCategories: number;
};

export function SpecsManager({
  groups,
  totalFields,
  totalOptions,
  categories,
  totalProducts,
  emptyCategories,
}: SpecsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Keep both Categories and the first Spec group expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["categories", ...groups.slice(0, 1).map((g) => g.id)])
  );

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

  function handleDeleteCategory(category: AdminCategory) {
    if (!window.confirm(`Xóa danh mục "${category.name}"? Sản phẩm sẽ bị gỡ khỏi danh mục này.`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Đã xóa danh mục.");
      router.refresh();
    });
  }

  function handleMoveCategory(category: AdminCategory, direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveCategory(category.id, direction);
      if (!result.ok) { toast.error(result.error); return; }
      router.refresh();
    });
  }

  const groupOrderIdx = new Map(groups.map((g, i) => [g.id, i]));
  const isCategoriesExpanded = expandedGroups.has("categories");

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <AdminPageHeader
        eyebrow="Cấu hình hệ thống"
        title="Phân loại & Thông số"
        description="Quản lý danh mục ngành hàng, các nhóm thông số kỹ thuật và bộ lọc sản phẩm hiển thị trên storefront."
        action={
          <Button onClick={() => setGroupDialog({ open: true })} disabled={isPending}>
            <PlusIcon className="size-4 mr-1.5" />
            Thêm nhóm thông số
          </Button>
        }
      />

      {/* Main tree list layout */}
      <div className="flex flex-col gap-4">
        
        {/* 1. System Category Card (Styled exactly like Spec Groups) */}
        <div
          className={cn(
            "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300",
            isCategoriesExpanded ? "ring-1 ring-border/80 shadow-md" : "hover:border-foreground/20"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-4 p-4",
              isCategoriesExpanded && "bg-muted/40 dark:bg-muted/10 border-b"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* No group reordering for categories as it is a core system group */}
              <div className="w-1.5 shrink-0" />
              
              <button
                type="button"
                onClick={() => toggleGroup("categories")}
                className="flex items-center gap-2.5 text-left min-w-0 group/btn"
              >
                <div className="flex size-8 items-center justify-center rounded-lg border bg-background/80 shadow-sm text-foreground/80">
                  <TagIcon className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover/btn:text-primary">
                    Danh mục sản phẩm
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
                    Product categories
                  </span>
                </div>
              </button>

              <Badge
                variant="secondary"
                className="text-[9px] font-semibold uppercase tracking-wider py-0.5 h-4.5 px-1.5 shrink-0 bg-primary/10 text-primary border-transparent"
              >
                Hệ thống
              </Badge>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-muted-foreground mr-1.5 font-medium hidden sm:inline">
                {categories.length} danh mục
              </span>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => toggleGroup("categories")}
                className="size-8"
              >
                <ChevronDownIcon
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-300",
                    isCategoriesExpanded && "rotate-180"
                  )}
                />
              </Button>
            </div>
          </div>

          {isCategoriesExpanded && (
            <div className="relative border-t bg-muted/5 dark:bg-muted/2 px-6 py-4 flex flex-col gap-4">
              {categories.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-background/50">
                  Chưa có danh mục nào.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                  <div className="divide-y divide-border/50">
                    {categories.map((category, orderIndex) => (
                      <div
                        key={category.id}
                        className="group flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Reordering Controls */}
                          <div className="flex items-center gap-0.5 text-muted-foreground/40 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Lên"
                              disabled={isPending || orderIndex === 0}
                              onClick={() => handleMoveCategory(category, "up")}
                              className="size-7 hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
                            >
                              <ChevronUpIcon className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Xuống"
                              disabled={isPending || orderIndex === categories.length - 1}
                              onClick={() => handleMoveCategory(category, "down")}
                              className="size-7 hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
                            >
                              <ChevronDownIcon className="size-4" />
                            </Button>
                          </div>

                          <div className="w-px h-5 bg-border/80 shrink-0" />

                          {/* Category Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {category.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                                /{category.slug}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-normal py-0 px-1.5 h-4.5 bg-muted/65 text-muted-foreground hover:bg-muted/80 shrink-0"
                            >
                              {category.product_count} sản phẩm
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Sửa danh mục"
                            render={<Link href={`/admin/categories/${category.id}/edit`} />}
                            nativeButton={false}
                            className="size-8 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Xóa danh mục"
                            disabled={isPending}
                            onClick={() => handleDeleteCategory(category)}
                            className="size-8 hover:bg-muted hover:text-destructive text-muted-foreground transition-colors"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className="border-dashed bg-background shadow-sm hover:bg-muted/30"
                  render={<Link href="/admin/categories/new" />}
                  nativeButton={false}
                >
                  <PlusIcon className="size-3.5 mr-1.5" />
                  Thêm danh mục mới
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Custom Spec Groups */}
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const gIdx = groupOrderIdx.get(group.id) ?? 0;

          return (
            <div
              key={group.id}
              className={cn(
                "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300",
                isExpanded ? "ring-1 ring-border/80 shadow-md" : "hover:border-foreground/20"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between gap-4 p-4",
                  isExpanded && "bg-muted/40 dark:bg-muted/10 border-b"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Up/Down buttons for sorting groups */}
                  <div className="flex items-center gap-0.5 text-muted-foreground/60 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Lên"
                      disabled={isPending || gIdx === 0}
                      onClick={() => handleReorderGroup(group, "up")}
                      className="size-6 hover:bg-background/80"
                    >
                      <ChevronUpIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Xuống"
                      disabled={isPending || gIdx === groups.length - 1}
                      onClick={() => handleReorderGroup(group, "down")}
                      className="size-6 hover:bg-background/80"
                    >
                      <ChevronDownIcon className="size-3.5" />
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-2.5 text-left min-w-0 group/btn"
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg border bg-background/80 shadow-sm text-foreground/80">
                      <LayersIcon className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover/btn:text-primary">
                        {group.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
                        {group.label_en}
                      </span>
                    </div>
                  </button>

                  <Badge
                    variant={group.kind === "tech" ? "default" : "secondary"}
                    className="text-[9px] font-semibold uppercase tracking-wider py-0.5 h-4.5 px-1.5 shrink-0"
                  >
                    {group.kind}
                  </Badge>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-xs text-muted-foreground mr-1.5 font-medium hidden sm:inline">
                    {group.fields?.length ?? 0} fields
                  </span>

                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sửa nhóm"
                      disabled={isPending}
                      onClick={() => setGroupDialog({ open: true, group })}
                      className="size-8 hover:bg-background/80"
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Xóa nhóm"
                      disabled={isPending}
                      onClick={() => handleDeleteGroup(group)}
                      className="size-8 hover:bg-background/80 hover:text-destructive"
                    >
                      <Trash2Icon className="size-3.5 text-destructive" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleGroup(group.id)}
                    className="size-8"
                  >
                    <ChevronDownIcon
                      className={cn(
                        "size-4 text-muted-foreground transition-transform duration-300",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="relative border-t bg-muted/10 dark:bg-muted/5 px-6 py-4 pl-12 flex flex-col gap-3.5">
                  <div className="absolute left-6 top-0 bottom-8 w-0.5 bg-border/70" />

                  {(group.fields ?? []).length === 0 ? (
                    <div className="relative py-4 pl-4 text-xs text-muted-foreground">
                      <div className="absolute -left-6 top-6 w-6 h-0.5 bg-border/70" />
                      Chưa có field nào trong nhóm này.
                    </div>
                  ) : (
                    (group.fields ?? []).map((field) => (
                      <div
                        key={field.id}
                        className="relative flex flex-col gap-2.5 p-3.5 bg-background border rounded-lg shadow-sm transition-all hover:shadow-md hover:border-foreground/15"
                      >
                        <div className="absolute -left-6 top-6 w-6 h-0.5 bg-border/70" />

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-sm font-semibold text-foreground">{field.label}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">({field.key})</span>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-4.5 px-1 bg-muted/20">
                              {field.type}
                            </Badge>
                            {field.hint && (
                              <span className="text-xs text-muted-foreground italic max-w-xs truncate" title={field.hint}>
                                — {field.hint}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Sửa field"
                              disabled={isPending}
                              onClick={() =>
                                setFieldDialog({
                                  open: true,
                                  field,
                                  groupId: group.id,
                                  nextSort: field.options?.length ?? 0,
                                })
                              }
                              className="size-7 hover:bg-muted"
                            >
                              <PencilIcon className="size-3 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Xóa field"
                              disabled={isPending}
                              onClick={() => handleDeleteField(field)}
                              className="size-7 hover:bg-muted hover:text-destructive"
                            >
                              <Trash2Icon className="size-3 text-destructive/80 hover:text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-dashed border-border/80">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mr-1.5 select-none">
                            Options:
                          </span>

                          {(field.options ?? []).map((option) => (
                            <div
                              key={option.id}
                              className="group/opt inline-flex items-center gap-1.5 rounded-full border bg-muted/20 hover:bg-muted/40 transition-colors pl-2.5 pr-1.5 py-0.5 text-xs font-medium"
                            >
                              {option.logo ? (
                                <img alt="" src={option.logo} className="size-3.5 object-contain" />
                              ) : null}
                              <span>{option.label}</span>
                              {!option.is_active && (
                                <span className="text-[9px] text-muted-foreground font-normal">(Ẩn)</span>
                              )}

                              <div className="flex items-center gap-0.5 ml-1 border-l pl-1.5 border-border/60">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOptionDialog({
                                      open: true,
                                      option,
                                      fieldId: field.id,
                                      nextSort: field.options?.length ?? 0,
                                    })
                                  }
                                  className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                                  title="Sửa option"
                                >
                                  <PencilIcon className="size-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOption(option)}
                                  className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                                  title="Xóa option"
                                >
                                  <Trash2Icon className="size-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              setOptionDialog({
                                open: true,
                                fieldId: field.id,
                                nextSort: (field.options?.length ?? 0) + 1,
                              })
                            }
                            className="h-6 rounded-full px-2.5 text-[10px] border-dashed hover:bg-muted/50 hover:border-foreground/30 transition-all"
                          >
                            <PlusIcon className="size-3 mr-1" />
                            Thêm option
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="relative pt-2 pl-4">
                    <div className="absolute -left-6 top-6 w-6 h-0.5 bg-border/70" />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      className="border-dashed bg-background shadow-sm hover:bg-muted/30"
                      onClick={() =>
                        setFieldDialog({
                          open: true,
                          groupId: group.id,
                          nextSort: (group.fields?.length ?? 0) + 1,
                        })
                      }
                    >
                      <PlusIcon className="size-3.5 mr-1.5" />
                      Thêm field mới
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {groupDialog.open && (
        <GroupDialog
          key={groupDialog.group?.id ?? "new-group"}
          open={groupDialog.open}
          onClose={() => setGroupDialog({ open: false })}
          group={groupDialog.group}
        />
      )}
      {fieldDialog.open && (
        <FieldDialog
          key={fieldDialog.field?.id ?? "new-field"}
          open={fieldDialog.open}
          onClose={() => setFieldDialog({ open: false, groupId: "", nextSort: 0 })}
          field={fieldDialog.field}
          groupId={fieldDialog.groupId}
          nextSortOrder={fieldDialog.nextSort}
        />
      )}
      {optionDialog.open && (
        <OptionDialog
          key={optionDialog.option?.id ?? "new-option"}
          open={optionDialog.open}
          onClose={() => setOptionDialog({ open: false, fieldId: "", nextSort: 0 })}
          option={optionDialog.option}
          fieldId={optionDialog.fieldId}
          nextSortOrder={optionDialog.nextSort}
        />
      )}
    </div>
  );
}
