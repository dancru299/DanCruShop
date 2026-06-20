import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SpecsManager } from "@/components/admin/specs-manager";
import { getAdminSpecGroups } from "@/lib/supabase/queries/specs";

export const dynamic = "force-dynamic";

export default async function AdminSpecsPage() {
  const groups = await getAdminSpecGroups();
  const totalFields = groups.reduce((sum, g) => sum + (g.fields?.length ?? 0), 0);
  const totalOptions = groups.reduce(
    (sum, g) => sum + (g.fields?.reduce((s, f) => s + (f.options?.length ?? 0), 0) ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Cấu hình hệ thống"
        title="Thông số kỹ thuật"
        description="Quản lý stack công nghệ, tích hợp, hosting và AI hiển thị trong bảng so sánh và bộ lọc sản phẩm. Thay đổi có hiệu lực ngay trên storefront."
      />

      <SpecsManager
        groups={groups}
        totalFields={totalFields}
        totalOptions={totalOptions}
      />
    </div>
  );
}
