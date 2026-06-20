import Link from "next/link";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { AdminMetric } from "@/components/admin/admin-metric";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { getAdminProducts } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  const publishedCount = products.filter(
    (product) => product.status === "published"
  ).length;
  const draftCount = products.filter(
    (product) => product.status === "draft"
  ).length;
  const archivedCount = products.filter(
    (product) => product.status === "archived"
  ).length;
  const missingImagesCount = products.filter(
    (product) => !product.thumbnail_url
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Quản lý sản phẩm"
        title="Sản phẩm"
        description="Quản lý nội dung danh mục, ảnh thumbnail, file tải về và trạng thái xuất bản."
        action={
          <Button
            render={<Link href="/admin/products/new" />}
            nativeButton={false}
          >
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Sản phẩm mới
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Tổng sản phẩm" value={products.length} />
        <AdminMetric label="Đã xuất bản" value={publishedCount} />
        <AdminMetric label="Bản nháp" value={draftCount} />
        <AdminMetric label="Thiếu ảnh" value={missingImagesCount} />
      </div>

      <ProductsTable products={products} />

      {archivedCount > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <ArchiveIcon aria-hidden="true" className="size-4" />
          Có {archivedCount} sản phẩm lưu trữ được ẩn khỏi catalog chính nhưng vẫn được lưu trong hồ sơ.
        </div>
      ) : null}
    </div>
  );
}
