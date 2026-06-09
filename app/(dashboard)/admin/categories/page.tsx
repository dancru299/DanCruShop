import { CategoryManager } from "@/components/admin/category-manager";
import { getAdminCategories } from "@/lib/supabase/queries/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Catalog</p>
        <h1 className="text-3xl font-semibold tracking-normal">Categories</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Tạo và quản lý category để phân loại sản phẩm. Khách dùng category để
          lọc trong storefront.
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
