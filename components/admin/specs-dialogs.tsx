"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createSpecGroup,
  updateSpecGroup,
  createSpecField,
  updateSpecField,
  createSpecOption,
  updateSpecOption,
  type SpecGroupInput,
  type SpecFieldInput,
  type SpecOptionInput,
} from "@/actions/specs.actions";
import { AdminMediaUploadField } from "@/components/admin/media-upload-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
} from "@/components/admin/home-layout-builder/builder-primitives";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SpecGroupRow, SpecFieldRow, SpecOptionRow } from "@/lib/supabase/queries/specs";

const BADGE_COLORS = [
  { value: "", label: "Không màu" },
  { value: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Xanh lá (emerald)" },
  { value: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400", label: "Xanh dương (sky)" },
  { value: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", label: "Chàm (indigo)" },
  { value: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400", label: "Tím (violet)" },
  { value: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Cam (amber)" },
  { value: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400", label: "Đỏ hồng (rose)" },
  { value: "border-foreground/25 bg-foreground/5 text-foreground", label: "Trung tính (neutral)" },
];

type DialogProps = {
  open: boolean;
  onClose: () => void;
};

type GroupDialogError = { label?: string; label_en?: string };

export function GroupDialog({
  open,
  onClose,
  group,
}: DialogProps & { group?: SpecGroupRow }) {
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(group?.label ?? "");
  const [labelEn, setLabelEn] = useState(group?.label_en ?? "");
  const [kind, setKind] = useState<"tech" | "meta">(group?.kind ?? "tech");
  const [errors, setErrors] = useState<GroupDialogError>({});

  if (!open) return null;

  function validate() {
    const next: GroupDialogError = {};
    if (!label.trim()) next.label = "Vui lòng nhập tên nhóm.";
    if (!labelEn.trim()) next.label_en = "Vui lòng nhập tên tiếng Anh.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const input: SpecGroupInput = {
      label: label.trim(),
      label_en: labelEn.trim(),
      kind,
      sort_order: group?.sort_order ?? 99,
    };

    startTransition(async () => {
      const result = group
        ? await updateSpecGroup(group.id, input)
        : await createSpecGroup(input);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(group ? "Đã cập nhật nhóm." : "Đã tạo nhóm.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold">{group ? "Sửa nhóm" : "Thêm nhóm"}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.label)}>
              <FieldLabel htmlFor="g-label">Tên (VI)</FieldLabel>
              <Input id="g-label" value={label} onChange={(e) => setLabel(e.target.value)} disabled={isPending} />
              <FieldError>{errors.label}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.label_en)}>
              <FieldLabel htmlFor="g-label-en">Tên (EN)</FieldLabel>
              <Input id="g-label-en" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} disabled={isPending} />
              <FieldError>{errors.label_en}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Loại</FieldLabel>
              <NativeSelect value={kind} onChange={(v) => setKind(v as "tech" | "meta")} options={[
                { value: "tech", label: "Công nghệ (tech)" },
                { value: "meta", label: "Meta (license, support...)" },
              ]} />
            </Field>
          </FieldGroup>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldDialogError = { key?: string; label?: string; label_en?: string };

export function FieldDialog({
  open,
  onClose,
  field,
  groupId,
  nextSortOrder,
}: DialogProps & { field?: SpecFieldRow; groupId: string; nextSortOrder: number }) {
  const [isPending, startTransition] = useTransition();
  const [key, setKey] = useState(field?.key ?? "");
  const [keyTouched, setKeyTouched] = useState(Boolean(field));
  const [label, setLabel] = useState(field?.label ?? "");
  const [labelEn, setLabelEn] = useState(field?.label_en ?? "");
  const [type, setType] = useState<"single" | "multi" | "boolean">(field?.type ?? "multi");
  const [hint, setHint] = useState(field?.hint ?? "");
  const [errors, setErrors] = useState<FieldDialogError>({});

  if (!open) return null;

  function handleLabelChange(v: string) {
    setLabel(v);
    if (!keyTouched) setKey(slugify(v));
  }

  function validate() {
    const next: FieldDialogError = {};
    if (!key.trim()) next.key = "Vui lòng nhập key.";
    if (!label.trim()) next.label = "Vui lòng nhập tên field.";
    if (!labelEn.trim()) next.label_en = "Vui lòng nhập tên tiếng Anh.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const input: SpecFieldInput = {
      key: slugify(key),
      label: label.trim(),
      label_en: labelEn.trim(),
      type,
      hint: type === "boolean" ? hint.trim() || null : null,
      group_id: groupId,
      sort_order: field?.sort_order ?? nextSortOrder,
    };

    startTransition(async () => {
      const result = field
        ? await updateSpecField(field.id, input)
        : await createSpecField(input);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(field ? "Đã cập nhật field." : "Đã tạo field.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold">{field ? "Sửa field" : "Thêm field"}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.label)}>
              <FieldLabel htmlFor="f-label">Tên (VI)</FieldLabel>
              <Input id="f-label" value={label} onChange={(e) => handleLabelChange(e.target.value)} disabled={isPending} />
              <FieldError>{errors.label}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.key)}>
              <FieldLabel htmlFor="f-key">Key (slug)</FieldLabel>
              <Input id="f-key" value={key} onChange={(e) => { setKeyTouched(true); setKey(e.target.value); }} disabled={isPending} />
              <FieldDescription>Tự sinh từ tên. Dùng làm key trong metadata.</FieldDescription>
              <FieldError>{errors.key}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.label_en)}>
              <FieldLabel htmlFor="f-label-en">Tên (EN)</FieldLabel>
              <Input id="f-label-en" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} disabled={isPending} />
              <FieldError>{errors.label_en}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Kiểu chọn</FieldLabel>
              <NativeSelect value={type} onChange={(v) => setType(v as typeof type)} options={[
                { value: "multi", label: "Nhiều lựa chọn (multi)" },
                { value: "single", label: "Một lựa chọn (single)" },
                { value: "boolean", label: "Bật / Tắt (boolean)" },
              ]} />
            </Field>
            {type === "boolean" ? (
              <Field>
                <FieldLabel htmlFor="f-hint">Gợi ý</FieldLabel>
                <Input id="f-hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="VD: Người mua nhận update mãi mãi." disabled={isPending} />
              </Field>
            ) : null}
          </FieldGroup>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type OptionDialogError = { value?: string; label?: string };

export function OptionDialog({
  open,
  onClose,
  option,
  fieldId,
  nextSortOrder,
}: DialogProps & { option?: SpecOptionRow; fieldId: string; nextSortOrder: number }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(option?.value ?? "");
  const [valueTouched, setValueTouched] = useState(Boolean(option));
  const [label, setLabel] = useState(option?.label ?? "");
  const [labelEn, setLabelEn] = useState(option?.label_en ?? "");
  const [className, setClassName] = useState(option?.class_name ?? "");
  const [logo, setLogo] = useState(option?.logo ?? "");
  const [isActive, setIsActive] = useState(option?.is_active ?? true);
  const [errors, setErrors] = useState<OptionDialogError>({});

  if (!open) return null;

  function handleLabelChange(v: string) {
    setLabel(v);
    if (!valueTouched) setValue(slugify(v));
  }

  function validate() {
    const next: OptionDialogError = {};
    if (!value.trim()) next.value = "Vui lòng nhập value.";
    if (!label.trim()) next.label = "Vui lòng nhập tên.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const input: SpecOptionInput = {
      value: slugify(value),
      label: label.trim(),
      label_en: labelEn.trim() || null,
      class_name: className || null,
      logo: logo.trim() || null,
      field_id: fieldId,
      sort_order: option?.sort_order ?? nextSortOrder,
      is_active: isActive,
    };

    startTransition(async () => {
      const result = option
        ? await updateSpecOption(option.id, input)
        : await createSpecOption(input);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(option ? "Đã cập nhật option." : "Đã tạo option.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold">{option ? "Sửa option" : "Thêm option"}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.label)}>
              <FieldLabel htmlFor="o-label">Tên (VI)</FieldLabel>
              <Input id="o-label" value={label} onChange={(e) => handleLabelChange(e.target.value)} disabled={isPending} />
              <FieldError>{errors.label}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.value)}>
              <FieldLabel htmlFor="o-value">Value (slug)</FieldLabel>
              <Input id="o-value" value={value} onChange={(e) => { setValueTouched(true); setValue(e.target.value); }} disabled={isPending} />
              <FieldDescription>Tự sinh từ tên. Dùng làm key trong metadata.</FieldDescription>
              <FieldError>{errors.value}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="o-label-en">Tên (EN)</FieldLabel>
              <Input id="o-label-en" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} placeholder="Để trống sẽ dùng tên VI" disabled={isPending} />
            </Field>
            <Field>
              <FieldLabel>Màu badge</FieldLabel>
              <NativeSelect value={className} onChange={setClassName} options={BADGE_COLORS} />
            </Field>
            <AdminMediaUploadField
              folder="products"
              id="o-logo"
              label="Logo"
              description="URL hoặc upload ảnh logo (vuông, nền trong suốt)."
              placeholder="https://... hoặc /logo_tech/..."
              value={logo}
              onChange={setLogo}
              disabled={isPending}
            />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Kích hoạt</span>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((v) => !v)}
                disabled={isPending}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                  isActive ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn("inline-block size-4 rounded-full bg-background shadow transition-transform", isActive ? "translate-x-5" : "translate-x-1")} />
              </button>
            </div>
          </FieldGroup>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
