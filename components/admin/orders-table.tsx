"use client";

import { useMemo, useState } from "react";
import { ReceiptTextIcon } from "lucide-react";

import {
  AdminActionMenu,
  AdminActionMenuText,
} from "@/components/admin/admin-action-menu";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminOrder, OrderStatus } from "@/lib/supabase/queries/orders";

type OrdersTableProps = {
  orders: AdminOrder[];
};

const statusLabels: Record<OrderStatus, string> = {
  cancelled: "Đã hủy",
  failed: "Thất bại",
  paid: "Đã thanh toán",
  pending: "Chờ xử lý",
  refunded: "Đã hoàn tiền",
};

function getStatusBadgeVariant(status: OrderStatus) {
  if (status === "paid") {
    return "default" as const;
  }

  if (status === "pending") {
    return "secondary" as const;
  }

  if (status === "failed" || status === "refunded") {
    return "destructive" as const;
  }

  return "outline" as const;
}

function formatTotal(order: AdminOrder) {
  const currency = order.currency.trim().toUpperCase() || "USD";
  const amount = currency === "VND" ? order.total_cents : order.total_cents / 100;

  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
    style: "currency",
  }).format(amount);
}

function formatProvider(provider: AdminOrder["provider"]) {
  if (provider === "paypal") {
    return "PayPal";
  }

  if (provider === "lemon_squeezy") {
    return "Lemon Squeezy";
  }

  if (provider === "vietqr_manual") {
    return "VietQR (cũ, thủ công)";
  }

  return "VietQR (cũ)";
}

function getOrderDisplayId(order: AdminOrder) {
  return order.provider_order_id ?? order.id.slice(0, 8);
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return orders;
    }

    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(term) ||
        order.provider_order_id?.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term)
    );
  }, [orders, query]);

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm kiếm đơn hàng theo Mã đơn hoặc Email..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Không gian đơn hàng
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Hiển thị {filtered.length}/{orders.length} đơn hàng.
          </p>
        </div>

        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Email khách hàng</TableHead>
                <TableHead>Cổng thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {getOrderDisplayId(order)}
                  </TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>{formatProvider(order.provider)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatTotal(order)}</TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu label={`Hành động cho đơn ${getOrderDisplayId(order)}`}>
                      <AdminActionMenuText>Không có hành động khả dụng</AdminActionMenuText>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={ReceiptTextIcon}
              title={
                orders.length === 0
                  ? "Chưa có đơn hàng"
                  : "Không tìm thấy đơn hàng"
              }
              description={
                orders.length === 0
                  ? "Đơn hàng sẽ xuất hiện ở đây sau khi khách bắt đầu thanh toán."
                  : "Vui lòng thử tìm kiếm bằng từ khóa khác."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
