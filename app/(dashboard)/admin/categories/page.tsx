import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { AdminMetric } from "@/components/admin/admin-metric";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryTable } from "@/components/admin/category-table";
import { Button } from "@/components/ui/button";
import { getAdminCategories } from "@/lib/supabase/queries/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  const totalProducts = categories.reduce(
    (sum, category) => sum + category.product_count,
    0
  );
  const emptyCategories = categories.filter(
    (category) => category.product_count === 0
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Tạo và quản lý category để phân loại sản phẩm. Khách dùng category để lọc trong storefront."
        action={
          <Button
            render={<Link href="/admin/categories/new" />}
            nativeButton={false}
          >
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Category mới
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetric label="Tổng category" value={categories.length} />
        <AdminMetric label="Lượt gán sản phẩm" value={totalProducts} />
        <AdminMetric label="Category trống" value={emptyCategories} />
      </div>

      <CategoryTable categories={categories} />
    </div>
  );
}
