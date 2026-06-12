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
        eyebrow="Product management"
        title="Products"
        description="Manage catalog content, storefront thumbnails, downloadable files, and publishing status."
        action={
          <Button
            render={<Link href="/admin/products/new" />}
            nativeButton={false}
          >
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            New Product
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Total products" value={products.length} />
        <AdminMetric label="Published" value={publishedCount} />
        <AdminMetric label="Drafts" value={draftCount} />
        <AdminMetric label="Missing images" value={missingImagesCount} />
      </div>

      <ProductsTable products={products} />

      {archivedCount > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <ArchiveIcon aria-hidden="true" className="size-4" />
          {archivedCount} archived product{archivedCount === 1 ? "" : "s"} are
          hidden from the main catalog but kept for records.
        </div>
      ) : null}
    </div>
  );
}
