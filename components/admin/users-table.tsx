"use client";

import { useMemo, useState } from "react";
import { UsersIcon } from "lucide-react";

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
import type { AdminCustomer } from "@/lib/supabase/queries/admin-users";

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  customer: "Khách hàng",
};

type UsersTableProps = {
  customers: AdminCustomer[];
};

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

export function UsersTable({ customers }: UsersTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.full_name?.toLowerCase().includes(term)
    );
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm kiếm khách hàng theo tên..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Không gian làm việc
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Hiển thị {filtered.length}/{customers.length} khách hàng.
          </p>
        </div>

        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên khách hàng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="text-right">Đơn hàng</TableHead>
                <TableHead className="text-right">Tổng chi tiêu</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      {customer.full_name ? (
                        <span className="font-medium">{customer.full_name}</span>
                      ) : (
                        <span className="italic text-muted-foreground">
                          Chưa cập nhật tên
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabels[customer.role] ?? customer.role}</Badge>
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
                  <TableCell className="text-right font-medium">
                    {formatSpent(customer)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu
                      label={`Thao tác cho ${customer.full_name ?? "khách hàng"}`}
                    >
                      <AdminActionMenuText>
                        {customer.purchase_count} đơn hàng
                      </AdminActionMenuText>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={UsersIcon}
              title={
                customers.length === 0
                  ? "Chưa có khách hàng"
                  : "Không tìm thấy khách hàng"
              }
              description={
                customers.length === 0
                  ? "Danh sách khách hàng sẽ xuất hiện ở đây sau khi có người đăng ký tài khoản."
                  : "Vui lòng thử tìm kiếm bằng từ khóa khác."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
