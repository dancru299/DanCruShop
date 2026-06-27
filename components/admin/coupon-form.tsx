"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeftIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createCoupon,
  updateCoupon,
  type CouponInput,
} from "@/actions/coupon.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CouponDiscountType } from "@/lib/payments/coupons";
import type { AdminCoupon } from "@/lib/supabase/queries/coupons";

type CouponFormProps = {
  mode: "create" | "edit";
  coupon?: AdminCoupon;
};

function toCents(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function fromCents(cents: number) {
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 16);
}

type CouponFormErrors = {
  code?: string;
  percentValue?: string;
  amountValue?: string;
};

export function CouponForm({ mode, coupon }: CouponFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const couponCurrency = coupon?.currency ?? "USD";

  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    coupon?.discount_type ?? "percent"
  );
  const [percentValue, setPercentValue] = useState(
    coupon && coupon.discount_type === "percent"
      ? String(coupon.discount_value)
      : "10"
  );
  const [amountValue, setAmountValue] = useState(
    coupon && coupon.discount_type === "fixed"
      ? fromCents(coupon.discount_value)
      : ""
  );
  const [currency, setCurrency] = useState(couponCurrency);
  const [minOrder, setMinOrder] = useState(
    coupon && coupon.min_order_cents > 0
      ? fromCents(coupon.min_order_cents)
      : ""
  );
  const [maxRedemptions, setMaxRedemptions] = useState(
    coupon?.max_redemptions != null ? String(coupon.max_redemptions) : ""
  );
  const [perUserLimit, setPerUserLimit] = useState(
    coupon?.per_user_limit != null ? String(coupon.per_user_limit) : ""
  );
  const [startsAt, setStartsAt] = useState(
    coupon?.starts_at ? toLocalInput(coupon.starts_at) : ""
  );
  const [expiresAt, setExpiresAt] = useState(
    coupon?.expires_at ? toLocalInput(coupon.expires_at) : ""
  );
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);
  const [errors, setErrors] = useState<CouponFormErrors>({});

  function validate() {
    const nextErrors: CouponFormErrors = {};

    if (!code.trim()) {
      nextErrors.code = "Vui lòng nhập mã giảm giá.";
    }

    if (discountType === "percent") {
      const pct = Number(percentValue);
      if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
        nextErrors.percentValue = "Phần trăm phải từ 1 đến 100.";
      }
    } else if (!amountValue.trim() || Number(amountValue) <= 0) {
      nextErrors.amountValue = "Vui lòng nhập số tiền giảm.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    const payload: CouponInput = {
      code: code.trim(),
      currency,
      description: description.trim() || null,
      discount_type: discountType,
      discount_value:
        discountType === "percent"
          ? Math.round(Number(percentValue))
          : toCents(amountValue),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive,
      max_redemptions: maxRedemptions ? Math.round(Number(maxRedemptions)) : null,
      min_order_cents: minOrder ? toCents(minOrder) : 0,
      per_user_limit: perUserLimit ? Math.round(Number(perUserLimit)) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCoupon(payload)
          : await updateCoupon(coupon?.id ?? "", payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "create" ? "Đã tạo mã giảm giá." : "Đã lưu mã.");
      router.push("/admin/coupons");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          variant="ghost"
          render={<Link href="/admin/coupons" />}
          nativeButton={false}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Quay lại Coupons
        </Button>
        <h1 className="text-3xl font-semibold tracking-normal">
          {mode === "create" ? "Mã giảm giá mới" : "Sửa mã giảm giá"}
        </h1>
      </div>

      <section className="flex max-w-2xl flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <Field data-invalid={Boolean(errors.code)}>
          <FieldLabel htmlFor="coupon-code">Mã</FieldLabel>
          <Input
            id="coupon-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="LAUNCH20"
            className="uppercase"
            aria-invalid={Boolean(errors.code)}
            disabled={isPending}
          />
          <FieldError>{errors.code}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Loại</FieldLabel>
            <Select
              value={discountType}
              onValueChange={(value) =>
                value && setDiscountType(value as CouponDiscountType)
              }
            >
              <SelectTrigger className="w-full" disabled={isPending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Phần trăm (%)</SelectItem>
                <SelectItem value="fixed">Số tiền cố định</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Tiền tệ</FieldLabel>
            <Select
              value={currency}
              onValueChange={(value) => value && setCurrency(value)}
            >
              <SelectTrigger className="w-full" disabled={isPending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {discountType === "percent" ? (
          <Field data-invalid={Boolean(errors.percentValue)}>
            <FieldLabel htmlFor="percent-value">Phần trăm giảm</FieldLabel>
            <Input
              id="percent-value"
              type="number"
              min="1"
              max="100"
              value={percentValue}
              onChange={(event) => setPercentValue(event.target.value)}
              aria-invalid={Boolean(errors.percentValue)}
              disabled={isPending}
            />
            <FieldDescription>Từ 1 đến 100.</FieldDescription>
            <FieldError>{errors.percentValue}</FieldError>
          </Field>
        ) : (
          <Field data-invalid={Boolean(errors.amountValue)}>
            <FieldLabel htmlFor="amount-value">
              Số tiền giảm ({currency})
            </FieldLabel>
            <Input
              id="amount-value"
              type="number"
              min="0"
              step="0.01"
              value={amountValue}
              onChange={(event) => setAmountValue(event.target.value)}
              aria-invalid={Boolean(errors.amountValue)}
              disabled={isPending}
            />
            <FieldError>{errors.amountValue}</FieldError>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="min-order">Đơn tối thiểu ({currency})</FieldLabel>
          <Input
            id="min-order"
            type="number"
            min="0"
            step="0.01"
            value={minOrder}
            onChange={(event) => setMinOrder(event.target.value)}
            placeholder="0"
            disabled={isPending}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="max-redemptions">Tổng lượt</FieldLabel>
            <Input
              id="max-redemptions"
              type="number"
              min="1"
              value={maxRedemptions}
              onChange={(event) => setMaxRedemptions(event.target.value)}
              placeholder="∞"
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="per-user-limit">Lượt / người</FieldLabel>
            <Input
              id="per-user-limit"
              type="number"
              min="1"
              value={perUserLimit}
              onChange={(event) => setPerUserLimit(event.target.value)}
              placeholder="∞"
              disabled={isPending}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="starts-at">Bắt đầu</FieldLabel>
            <Input
              id="starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="expires-at">Hết hạn</FieldLabel>
            <Input
              id="expires-at"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={isPending}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="coupon-description">Ghi chú</FieldLabel>
          <Textarea
            id="coupon-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Chiến dịch ra mắt (tùy chọn)."
            disabled={isPending}
          />
        </Field>

        <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm font-medium">Đang bật</span>
          <button
            type="button"
            onClick={() => setIsActive((value) => !value)}
            disabled={isPending}
            aria-pressed={isActive}
            className={
              "inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors " +
              (isActive ? "bg-primary" : "bg-muted")
            }
          >
            <span
              className={
                "size-4 rounded-full bg-background transition-transform " +
                (isActive ? "translate-x-5" : "translate-x-0")
              }
            />
          </button>
        </label>
      </section>

      <div className="flex max-w-2xl flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          render={<Link href="/admin/coupons" />}
          nativeButton={false}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <SaveIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {mode === "create" ? "Tạo mã" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
