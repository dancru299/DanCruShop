"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createCoupon,
  deleteCoupon,
  updateCoupon,
  type CouponInput,
} from "@/actions/coupon.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/products/display";
import type { CouponDiscountType } from "@/lib/payments/coupons";
import type { AdminCoupon } from "@/lib/supabase/queries/coupons";

type CouponManagerProps = {
  coupons: AdminCoupon[];
};

function toCents(value: string, currency: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return currency === "VND" ? Math.round(parsed) : Math.round(parsed * 100);
}

function fromCents(cents: number, currency: string) {
  if (currency === "VND") {
    return String(cents);
  }

  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 16);
}

function formatDiscount(coupon: AdminCoupon) {
  if (coupon.discount_type === "percent") {
    return `${coupon.discount_value}%`;
  }

  return formatPrice(coupon.discount_value, coupon.currency ?? "USD");
}

export function CouponManager({ coupons }: CouponManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("percent");
  const [percentValue, setPercentValue] = useState("10");
  const [amountValue, setAmountValue] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [minOrder, setMinOrder] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  function resetForm() {
    setEditingId(null);
    setCode("");
    setDescription("");
    setDiscountType("percent");
    setPercentValue("10");
    setAmountValue("");
    setCurrency("VND");
    setMinOrder("");
    setMaxRedemptions("");
    setPerUserLimit("");
    setStartsAt("");
    setExpiresAt("");
    setIsActive(true);
  }

  function startEdit(coupon: AdminCoupon) {
    const couponCurrency = coupon.currency ?? "VND";

    setEditingId(coupon.id);
    setCode(coupon.code);
    setDescription(coupon.description ?? "");
    setDiscountType(coupon.discount_type);
    setPercentValue(
      coupon.discount_type === "percent" ? String(coupon.discount_value) : "10"
    );
    setAmountValue(
      coupon.discount_type === "fixed"
        ? fromCents(coupon.discount_value, couponCurrency)
        : ""
    );
    setCurrency(couponCurrency);
    setMinOrder(
      coupon.min_order_cents > 0
        ? fromCents(coupon.min_order_cents, couponCurrency)
        : ""
    );
    setMaxRedemptions(
      coupon.max_redemptions != null ? String(coupon.max_redemptions) : ""
    );
    setPerUserLimit(
      coupon.per_user_limit != null ? String(coupon.per_user_limit) : ""
    );
    setStartsAt(coupon.starts_at ? toLocalInput(coupon.starts_at) : "");
    setExpiresAt(coupon.expires_at ? toLocalInput(coupon.expires_at) : "");
    setIsActive(coupon.is_active);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!code.trim()) {
      toast.error("Nhập mã giảm giá.");
      return;
    }

    const payload: CouponInput = {
      code: code.trim(),
      currency,
      description: description.trim() || null,
      discount_type: discountType,
      discount_value:
        discountType === "percent"
          ? Math.round(Number(percentValue))
          : toCents(amountValue, currency),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive,
      max_redemptions: maxRedemptions ? Math.round(Number(maxRedemptions)) : null,
      min_order_cents: minOrder ? toCents(minOrder, currency) : 0,
      per_user_limit: perUserLimit ? Math.round(Number(perUserLimit)) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    };

    startTransition(async () => {
      const result = editingId
        ? await updateCoupon(editingId, payload)
        : await createCoupon(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(editingId ? "Đã cập nhật mã." : "Đã tạo mã giảm giá.");
      resetForm();
      router.refresh();
    });
  }

  function handleDelete(coupon: AdminCoupon) {
    if (!window.confirm(`Xóa mã "${coupon.code}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCoupon(coupon.id);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã xóa mã.");

      if (editingId === coupon.id) {
        resetForm();
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
      <form
        onSubmit={handleSubmit}
        className="flex h-fit flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm xl:sticky xl:top-24"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal">
            {editingId ? "Sửa mã giảm giá" : "Mã giảm giá mới"}
          </h2>
          {editingId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetForm}
              disabled={isPending}
            >
              <XIcon aria-hidden="true" data-icon="inline-start" />
              Hủy
            </Button>
          ) : null}
        </div>

        <Field>
          <FieldLabel htmlFor="coupon-code">Mã</FieldLabel>
          <Input
            id="coupon-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="LAUNCH20"
            className="uppercase"
            disabled={isPending}
          />
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
                <SelectItem value="VND">VND</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {discountType === "percent" ? (
          <Field>
            <FieldLabel htmlFor="percent-value">Phần trăm giảm</FieldLabel>
            <Input
              id="percent-value"
              type="number"
              min="1"
              max="100"
              value={percentValue}
              onChange={(event) => setPercentValue(event.target.value)}
              disabled={isPending}
            />
            <FieldDescription>Từ 1 đến 100.</FieldDescription>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="amount-value">
              Số tiền giảm ({currency})
            </FieldLabel>
            <Input
              id="amount-value"
              type="number"
              min="0"
              step={currency === "VND" ? "1" : "0.01"}
              value={amountValue}
              onChange={(event) => setAmountValue(event.target.value)}
              disabled={isPending}
            />
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="min-order">
            Đơn tối thiểu ({currency})
          </FieldLabel>
          <Input
            id="min-order"
            type="number"
            min="0"
            step={currency === "VND" ? "1" : "0.01"}
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

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {editingId ? "Lưu thay đổi" : "Tạo mã"}
        </Button>
      </form>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Tất cả mã giảm giá
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {coupons.length} mã. Áp dụng ở giỏ hàng cho cả VietQR và Lemon
            Squeezy.
          </p>
        </div>

        {coupons.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Giảm</TableHead>
                <TableHead>Lượt dùng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <p className="font-medium">{coupon.code}</p>
                    {coupon.description ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {coupon.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>
                    {coupon.times_redeemed}
                    {coupon.max_redemptions != null
                      ? ` / ${coupon.max_redemptions}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.is_active ? "default" : "secondary"}>
                      {coupon.is_active ? "Bật" : "Tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(coupon)}
                        disabled={isPending}
                      >
                        <PencilIcon aria-hidden="true" data-icon="inline-start" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(coupon)}
                        disabled={isPending}
                      >
                        <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-medium">Chưa có mã giảm giá</p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Tạo mã đầu tiên để chạy khuyến mãi. Khách nhập mã ở trang giỏ hàng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
