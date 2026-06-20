import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HomeLayoutBuilder } from "@/components/admin/home-layout-builder";
import { getHomeLayout } from "@/lib/store/home-layout.server";
import { getCategoryOptions } from "@/lib/supabase/queries/categories";

export const dynamic = "force-dynamic";

export default async function AdminHomeLayoutPage() {
  const [layout, categories] = await Promise.all([
    getHomeLayout(),
    getCategoryOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Cửa hàng"
        title="Bố cục trang chủ"
        description="Thêm, sửa, sắp xếp và bật/tắt các section trên trang chủ. Bấm vào tên section để chỉnh sửa nội dung, rồi lưu lại."
      />

      <HomeLayoutBuilder initialLayout={layout} categories={categories} />
    </div>
  );
}
