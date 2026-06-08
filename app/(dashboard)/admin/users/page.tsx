import { UsersIcon } from "lucide-react";

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
  getAdminCustomers,
  type AdminCustomer,
} from "@/lib/supabase/queries/admin-users";

export const dynamic = "force-dynamic";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatSpent(customer: AdminCustomer) {
  if (customer.purchase_count === 0) return "—";

  const currency = customer.primary_currency.trim().toUpperCase();
  const amount =
    currency === "VND"
      ? customer.total_spent_cents
      : customer.total_spent_cents / 100;

  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
    style: "currency",
  }).format(amount);
}

export default async function AdminUsersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Customer management</p>
        <h1 className="text-3xl font-semibold tracking-normal">Customers</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Danh sách tất cả khách hàng và thống kê mua hàng của họ.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {customers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="text-right">Đơn hàng</TableHead>
                <TableHead className="text-right">Tổng chi tiêu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    {customer.full_name ? (
                      <span className="font-medium">{customer.full_name}</span>
                    ) : (
                      <span className="italic text-muted-foreground">
                        Chưa cập nhật
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{customer.role}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(customer.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {customer.purchase_count > 0 ? (
                      <span className="font-medium">
                        {customer.purchase_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatSpent(customer)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <UsersIcon aria-hidden="true" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Chưa có khách hàng
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Danh sách khách hàng sẽ xuất hiện ở đây sau khi có người đăng
                ký tài khoản.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
