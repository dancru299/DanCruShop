import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { getAdminOrders } from "@/lib/supabase/queries/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Quản lý giao dịch"
        title="Đơn hàng"
        description="Theo dõi lịch sử thanh toán, doanh thu và phê duyệt thủ công các đơn VietQR đang chờ xử lý."
      />

      <OrdersTable orders={orders} />
    </div>
  );
}
