"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createVariant,
  deleteVariant,
  reorderVariants,
  setDefaultVariant,
  updateVariant,
} from "@/actions/product-variants.actions";
import { ProductFileManager } from "@/components/admin/product-file-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductVariant } from "@/lib/supabase/queries/product-variants";
import { cn } from "@/lib/utils";

import { formatPriceInput, parsePriceCents } from "./product-form/constants";

type ProductVariantsEditorProps = {
  productId: string;
  currency: string;
  variants: ProductVariant[];
};

type VariantDraft = {
  name: string;
  priceInput: string;
  compareInput: string;
  isActive: boolean;
  requiresLicense: boolean;
  lemonVariant: string;
};

function toDraft(variant: ProductVariant): VariantDraft {
  return {
    name: variant.name,
    priceInput: formatPriceInput(variant.price_cents),
    compareInput:
      variant.compare_at_price_cents != null
        ? formatPriceInput(variant.compare_at_price_cents)
        : "",
    isActive: variant.is_active,
    requiresLicense: variant.requires_license,
    lemonVariant: variant.lemon_squeezy_variant_id ?? "",
  };
}

function buildDrafts(variants: ProductVariant[]) {
  return Object.fromEntries(
    variants.map((variant) => [variant.id, toDraft(variant)])
  ) as Record<string, VariantDraft>;
}

function priceLabel(draft: VariantDraft, currency: string) {
  const cents = parsePriceCents(draft.priceInput);
  return cents === 0 ? "Miễn phí" : `${draft.priceInput || "0"} ${currency}`;
}

export function ProductVariantsEditor({
  productId,
  currency,
  variants,
}: ProductVariantsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>(() =>
    buildDrafts(variants)
  );
  const [selectedId, setSelectedId] = useState<string>(
    () =>
      variants.find((variant) => variant.is_default)?.id ??
      variants[0]?.id ??
      ""
  );
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const dirtyRef = useRef(dirty);

  function markDirty(id: string) {
    setDirty((current) => {
      if (current.has(id)) return current;
      const next = new Set(current).add(id);
      dirtyRef.current = next;
      return next;
    });
  }

  function clearDirty(id: string) {
    setDirty((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      dirtyRef.current = next;
      return next;
    });
  }

  const signature = variants
    .map((v) => `${v.id}:${v.position}:${v.is_default ? 1 : 0}`)
    .join("|");
  const lastSignature = useRef(signature);

  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    setDrafts((previous) => {
      const fresh = buildDrafts(variants);
      for (const id of dirtyRef.current) {
        if (fresh[id] && previous[id]) fresh[id] = previous[id];
      }
      return fresh;
    });
    setSelectedId((current) =>
      variants.some((v) => v.id === current)
        ? current
        : variants.find((v) => v.is_default)?.id ?? variants[0]?.id ?? ""
    );
  }, [signature, variants]);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? variants[0],
    [variants, selectedId]
  );
  const draft = selected ? drafts[selected.id] : undefined;
  const selectedDirty = selected ? dirty.has(selected.id) : false;
  const selectedIndex = variants.findIndex((v) => v.id === selected?.id);

  function patchDraft(id: string, patch: Partial<VariantDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    markDirty(id);
  }

  function handleSave() {
    if (!selected || !draft) return;

    const priceCents = parsePriceCents(draft.priceInput);
    if (priceCents === null) {
      toast.error("Giá phải là số ≥ 0.");
      return;
    }
    const compareCents = draft.compareInput.trim()
      ? parsePriceCents(draft.compareInput)
      : null;
    if (draft.compareInput.trim() && compareCents === null) {
      toast.error("Giá gốc không hợp lệ.");
      return;
    }

    startTransition(async () => {
      const result = await updateVariant(selected.id, {
        name: draft.name,
        price_cents: priceCents,
        compare_at_price_cents: compareCents,
        is_active: draft.isActive,
        requires_license: draft.requiresLicense,
        lemon_squeezy_variant_id: draft.lemonVariant.trim() || null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      clearDirty(selected.id);
      toast.success("Đã lưu phiên bản.");
      router.refresh();
    });
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await createVariant(productId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã thêm phiên bản. Đặt tên, giá và file cho nó.");
      setSelectedId(result.variantId);
      router.refresh();
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultVariant(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã đặt phiên bản mặc định.");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Xóa phiên bản này? File của nó cũng sẽ bị xóa. Không thể hoàn tác."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteVariant(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      clearDirty(id);
      toast.success("Đã xóa phiên bản.");
      router.refresh();
    });
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= variants.length) return;

    const orderedIds = variants.map((v) => v.id);
    [orderedIds[index], orderedIds[target]] = [
      orderedIds[target],
      orderedIds[index],
    ];

    startTransition(async () => {
      const result = await reorderVariants(productId, orderedIds);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-normal">
              Phiên bản
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Mỗi phiên bản có giá và file riêng nhưng dùng chung nội dung (tên,
              mô tả, ảnh) ở tab Tổng quan. Phiên bản có dấu sao hiển thị ngoài
              danh sách.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={isPending}
          >
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Thêm phiên bản
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Phiên bản</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Chính</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => {
                const variantDraft = drafts[variant.id];
                const active = variant.id === selected?.id;

                return (
                  <TableRow
                    key={variant.id}
                    onClick={() => setSelectedId(variant.id)}
                    className={cn("cursor-pointer", active && "bg-muted/50")}
                  >
                    <TableCell>
                      {dirty.has(variant.id) ? (
                        <span
                          aria-label="Chưa lưu"
                          title="Chưa lưu"
                          className="inline-block size-2 rounded-full bg-amber-400"
                        />
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {variantDraft?.name || variant.name}
                        {variantDraft && !variantDraft.isActive ? (
                          <Badge variant="outline" className="gap-1">
                            <EyeOffIcon aria-hidden="true" className="size-3" />
                            Ẩn
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>
                      {variantDraft ? priceLabel(variantDraft, currency) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant.is_active ? "default" : "secondary"}>
                        {variant.is_active ? "Hiển thị" : "Ẩn"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {variant.is_default ? (
                        <StarIcon
                          aria-hidden="true"
                          className="ml-auto size-4 fill-current text-amber-400"
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {selected && draft ? (
          <div className="flex flex-col gap-5 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">
                  {draft.name || selected.name}
                </span>
                {selected.is_default ? (
                  <Badge variant="secondary">Mặc định</Badge>
                ) : null}
                {selectedDirty ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <span className="inline-block size-2 rounded-full bg-amber-400" />
                    Chưa lưu
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(selectedIndex, -1)}
                  disabled={isPending || selectedIndex <= 0}
                >
                  <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
                  Lùi
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(selectedIndex, 1)}
                  disabled={isPending || selectedIndex >= variants.length - 1}
                >
                  Tiến
                  <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
                {!selected.is_default ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(selected.id)}
                    disabled={isPending}
                  >
                    <StarIcon aria-hidden="true" data-icon="inline-start" />
                    Đặt mặc định
                  </Button>
                ) : null}
                {variants.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selected.id)}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                    Xóa
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="variant-name">Tên phiên bản</FieldLabel>
                <Input
                  id="variant-name"
                  value={draft.name}
                  onChange={(event) =>
                    patchDraft(selected.id, { name: event.target.value })
                  }
                  placeholder="vd: Bản thô, Plus, Đỏ"
                  disabled={isPending}
                />
                <FieldDescription>
                  Tên hiển thị ở bộ chọn ngoài trang sản phẩm.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="variant-price">
                  Giá bán ({currency})
                </FieldLabel>
                <Input
                  id="variant-price"
                  type="number"
                  min="0"
                  step={currency === "VND" ? "1" : "0.01"}
                  value={draft.priceInput}
                  onChange={(event) =>
                    patchDraft(selected.id, { priceInput: event.target.value })
                  }
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="variant-compare">
                  Giá gốc ({currency})
                </FieldLabel>
                <Input
                  id="variant-compare"
                  type="number"
                  min="0"
                  step={currency === "VND" ? "1" : "0.01"}
                  value={draft.compareInput}
                  onChange={(event) =>
                    patchDraft(selected.id, { compareInput: event.target.value })
                  }
                  placeholder="Bỏ trống nếu không giảm giá"
                  disabled={isPending}
                />
                <FieldDescription>Phải lớn hơn giá bán.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="variant-lemon">
                  ID biến thể Lemon Squeezy
                </FieldLabel>
                <Input
                  id="variant-lemon"
                  value={draft.lemonVariant}
                  onChange={(event) =>
                    patchDraft(selected.id, { lemonVariant: event.target.value })
                  }
                  placeholder="Tùy chọn"
                  disabled={isPending}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() =>
                  patchDraft(selected.id, { isActive: !draft.isActive })
                }
                disabled={isPending}
                aria-pressed={draft.isActive}
                className={cn(
                  "flex flex-1 items-center justify-between gap-4 rounded-lg border p-3 text-left transition-colors",
                  draft.isActive ? "bg-background hover:bg-muted" : "border-amber-400/40 bg-amber-400/5"
                )}
              >
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">Hiển thị phiên bản</span>
                  <span className="text-xs text-muted-foreground">
                    Tắt để ẩn phiên bản này khỏi bộ chọn ngoài cửa hàng.
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
                    draft.isActive ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full bg-background transition-transform",
                      draft.isActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  patchDraft(selected.id, {
                    requiresLicense: !draft.requiresLicense,
                  })
                }
                disabled={isPending}
                aria-pressed={draft.requiresLicense}
                className={cn(
                  "flex flex-1 items-center justify-between gap-4 rounded-lg border p-3 text-left transition-colors",
                  draft.requiresLicense
                    ? "border-primary bg-primary/5"
                    : "bg-background hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                    <KeyRoundIcon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">License key</span>
                    <span className="text-xs text-muted-foreground">
                      Sinh key cho mỗi người mua phiên bản này.
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
                    draft.requiresLicense ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full bg-background transition-transform",
                      draft.requiresLicense ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              {selectedDirty ? (
                <span className="text-xs text-muted-foreground">
                  Có thay đổi chưa lưu
                </span>
              ) : null}
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <Loader2Icon
                    aria-hidden="true"
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <SaveIcon aria-hidden="true" data-icon="inline-start" />
                )}
                Lưu phiên bản
              </Button>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <h3 className="text-sm font-semibold tracking-normal">
                File giao cho khách
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                File của riêng phiên bản này. File đầu tiên là file chính.
              </p>
              <ProductFileManager
                key={selected.id}
                productId={productId}
                variantId={selected.id}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
