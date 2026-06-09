import { SettingsForm } from "@/components/admin/settings-form";
import { getStoreSettings } from "@/lib/store/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Cấu hình</p>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Cấu hình thanh toán VietQR và thông tin shop. Giá trị để trống sẽ dùng
          biến môi trường làm mặc định.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
