import { ReceiptTextIcon } from "lucide-react";

import {
  AdminActionMenu,
  AdminActionMenuText,
} from "@/components/admin/admin-action-menu";
import { ApproveVietQrOrderButton } from "@/components/admin/approve-vietqr-order-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminOrders,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/supabase/queries/orders";

export const dynamic = "force-dynamic";

const statusLabels: Record<OrderStatus, string> = {
  cancelled: "Cancelled",
  failed: "Failed",
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
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
  if (provider === "lemon_squeezy") {
    return "Lemon Squeezy";
  }

  if (provider === "vietqr") {
    return "VietQR";
  }

  return "VietQR Manual";
}

function getOrderDisplayId(order: AdminOrder) {
  return order.provider_order_id ?? order.id.slice(0, 8);
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Order management</p>
        <h1 className="text-3xl font-semibold tracking-normal">Orders</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Theo dõi thanh toán và duyệt thủ công các đơn VietQR đang chờ xử lý.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
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
                  <TableCell>{formatTotal(order)}</TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu label={`Actions for order ${getOrderDisplayId(order)}`}>
                      {order.provider === "vietqr" &&
                      order.status === "pending" ? (
                        <ApproveVietQrOrderButton orderId={order.id} menuItem />
                      ) : (
                        <AdminActionMenuText>No actions available</AdminActionMenuText>
                      )}
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <ReceiptTextIcon aria-hidden="true" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Chưa có đơn hàng
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Đơn Lemon Squeezy và VietQR sẽ xuất hiện ở đây sau khi khách
                bắt đầu thanh toán.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
