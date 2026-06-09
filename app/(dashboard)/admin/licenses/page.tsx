import { LicenseManager } from "@/components/admin/license-manager";
import { getAdminLicenseKeys } from "@/lib/supabase/queries/licenses";

export const dynamic = "force-dynamic";

export default async function AdminLicensesPage() {
  const licenses = await getAdminLicenseKeys();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Bảo mật</p>
        <h1 className="text-3xl font-semibold tracking-normal">Licenses</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Key kích hoạt tự sinh cho sản phẩm bật “Yêu cầu license key”. Thu hồi
          key sẽ vô hiệu nó ngay.
        </p>
      </div>

      <LicenseManager licenses={licenses} />
    </div>
  );
}
