"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { BanIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { setLicenseStatus } from "@/actions/license.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminLicenseKey } from "@/lib/supabase/queries/licenses";

type LicenseManagerProps = {
  licenses: AdminLicenseKey[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export function LicenseManager({ licenses }: LicenseManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

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
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Tìm theo key, sản phẩm hoặc email..."
        className="max-w-md"
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {licenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License key</TableHead>
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
                      {license.status === "active" ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggle(license)}
                      disabled={isPending}
                    >
                      {license.status === "active" ? (
                        <>
                          <BanIcon aria-hidden="true" data-icon="inline-start" />
                          Thu hồi
                        </>
                      ) : (
                        <>
                          <RotateCcwIcon
                            aria-hidden="true"
                            data-icon="inline-start"
                          />
                          Khôi phục
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-medium">Chưa có license key</p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Bật “Yêu cầu license key” trong sản phẩm; key sẽ tự sinh khi khách
              mua.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
