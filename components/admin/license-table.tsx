"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";

import { setLicenseStatus } from "@/actions/license.actions";
import {
  AdminActionMenu,
  AdminActionMenuButton,
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
import type { AdminLicenseKey } from "@/lib/supabase/queries/licenses";

type LicenseTableProps = {
  licenses: AdminLicenseKey[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export function LicenseTable({ licenses }: LicenseTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return licenses;
    }

    return licenses.filter(
      (license) =>
        license.license_key.toLowerCase().includes(term) ||
        license.product?.title.toLowerCase().includes(term) ||
        license.order?.email.toLowerCase().includes(term)
    );
  }, [licenses, query]);

  function handleToggle(license: AdminLicenseKey) {
    const nextStatus = license.status === "active" ? "revoked" : "active";

    startTransition(async () => {
      const result = await setLicenseStatus(license.id, nextStatus);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        nextStatus === "revoked" ? "Đã thu hồi key." : "Đã khôi phục key."
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm theo key, sản phẩm hoặc email..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Danh sách license key
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {filtered.length}/{licenses.length} key đang hiển thị.
          </p>
        </div>

        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã license</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Khách</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {license.license_key}
                    </code>
                  </TableCell>
                  <TableCell>{license.product?.title ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {license.order?.email ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(license.created_at)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        license.status === "active" ? "default" : "outline"
                      }
                    >
                      {license.status === "active" ? "Đang hoạt động" : "Đã thu hồi"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu
                      label={`Thao tác cho ${license.license_key}`}
                    >
                      {license.status === "active" ? (
                        <AdminActionMenuButton
                          icon="ban"
                          tone="destructive"
                          disabled={isPending}
                          onClick={() => handleToggle(license)}
                        >
                          Thu hồi
                        </AdminActionMenuButton>
                      ) : (
                        <AdminActionMenuButton
                          icon="restore"
                          disabled={isPending}
                          onClick={() => handleToggle(license)}
                        >
                          Khôi phục
                        </AdminActionMenuButton>
                      )}
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={KeyRoundIcon}
              title={
                licenses.length === 0
                  ? "Chưa có license key"
                  : "Không tìm thấy license key khớp tìm kiếm"
              }
              description={
                licenses.length === 0
                  ? "Bật &ldquo;Yêu cầu license key&rdquo; trong sản phẩm; license key sẽ tự sinh khi khách mua."
                  : "Vui lòng thử tìm kiếm bằng từ khóa khác."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
