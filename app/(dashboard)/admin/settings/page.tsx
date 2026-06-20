import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getStoreSettings } from "@/lib/store/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Cấu hình"
        title="Cài đặt"
        description="Cấu hình thanh toán VietQR và thông tin shop. Giá trị để trống sẽ dùng biến môi trường làm mặc định."
      />

      <SettingsForm settings={settings} />
    </div>
  );
}
