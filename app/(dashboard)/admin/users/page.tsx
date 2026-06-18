import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { UsersTable } from "@/components/admin/users-table";
import { getAdminCustomers } from "@/lib/supabase/queries/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Quản lý khách hàng"
        title="Khách hàng"
        description="Danh sách tất cả khách hàng đăng ký tài khoản và lịch sử giao dịch của họ."
      />

      <UsersTable customers={customers} />
    </div>
  );
}
