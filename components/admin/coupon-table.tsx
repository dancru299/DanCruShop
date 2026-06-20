"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { TicketPercentIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";

import { deleteCoupon } from "@/actions/coupon.actions";
import {
  AdminActionMenu,
  AdminActionMenuButton,
  AdminActionMenuLink,
} from "@/components/admin/admin-action-menu";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/products/display";
import type { AdminCoupon } from "@/lib/supabase/queries/coupons";

type CouponTableProps = {
  coupons: AdminCoupon[];
};

function formatDiscount(coupon: AdminCoupon) {
  if (coupon.discount_type === "percent") {
    return `${coupon.discount_value}%`;
  }

  return formatPrice(coupon.discount_value, coupon.currency ?? "USD");
}

export function CouponTable({ coupons }: CouponTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return coupons;
    }

    return coupons.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(term) ||
        coupon.description?.toLowerCase().includes(term)
    );
  }, [coupons, query]);

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
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm mã theo code hoặc ghi chú..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Tất cả mã giảm giá
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {filtered.length}/{coupons.length} mã đang hiển thị. Áp dụng ở giỏ
            hàng cho cả VietQR và Lemon Squeezy.
          </p>
        </div>

        {filtered.length > 0 ? (
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
              {filtered.map((coupon) => (
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
                    <AdminActionMenu label={`Thao tác cho ${coupon.code}`}>
                      <AdminActionMenuLink
                        href={`/admin/coupons/${coupon.id}/edit`}
                        icon="pencil"
                      >
                        Sửa
                      </AdminActionMenuLink>
                      <AdminActionMenuButton
                        icon="trash"
                        tone="destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(coupon)}
                      >
                        Xóa
                      </AdminActionMenuButton>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={TicketPercentIcon}
              title={
                coupons.length === 0
                  ? "Chưa có mã giảm giá"
                  : "Không tìm thấy mã khớp tìm kiếm"
              }
              description={
                coupons.length === 0
                  ? "Tạo mã đầu tiên để chạy khuyến mãi. Khách nhập mã ở trang giỏ hàng."
                  : "Vui lòng thử tìm kiếm bằng từ khóa khác."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
