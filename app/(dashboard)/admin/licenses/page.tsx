import { AdminMetric } from "@/components/admin/admin-metric";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LicenseTable } from "@/components/admin/license-table";
import { getAdminLicenseKeys } from "@/lib/supabase/queries/licenses";

export const dynamic = "force-dynamic";

export default async function AdminLicensesPage() {
  const licenses = await getAdminLicenseKeys();
  const activeCount = licenses.filter(
    (license) => license.status === "active"
  ).length;
  const revokedCount = licenses.length - activeCount;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Bảo mật"
        title="License key"
        description="Key kích hoạt tự sinh cho sản phẩm bật “Yêu cầu license key”. Thu hồi key sẽ vô hiệu nó ngay."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Tổng key" value={licenses.length} />
        <AdminMetric label="Đang hoạt động" value={activeCount} />
        <AdminMetric label="Đã thu hồi" value={revokedCount} />
      </div>

      <LicenseTable licenses={licenses} />
    </div>
  );
}
