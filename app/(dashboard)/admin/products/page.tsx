/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArchiveIcon,
  ImageIcon,
  PackageCheckIcon,
  PlusIcon,
} from "lucide-react";

import {
  AdminActionMenu,
  AdminActionMenuLink,
} from "@/components/admin/admin-action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminProducts,
  type AdminProductListItem,
} from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

const statusLabels: Record<AdminProductListItem["status"], string> = {
  archived: "Archived",
  draft: "Draft",
  published: "Published",
};

const productTypeLabels: Record<AdminProductListItem["product_type"], string> = {
  bundle: "Bundle",
  course: "Course",
  digital_download: "Download",
  free_resource: "Free",
  template: "Template",
  tool: "Tool",
};

function formatPrice(product: AdminProductListItem) {
  if (product.is_free) {
    return "Free";
  }

  const currency = product.currency.trim().toUpperCase() || "USD";
  const amount = currency === "VND" ? product.price_cents : product.price_cents / 100;

  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
    style: "currency",
  }).format(amount);
}

function getStatusBadgeVariant(status: AdminProductListItem["status"]) {
  if (status === "published") {
    return "default" as const;
  }

  if (status === "archived") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function ProductMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function ProductThumbnail({ product }: { product: AdminProductListItem }) {
  return (
    <div className="relative size-14 overflow-hidden rounded-lg border bg-muted">
      {product.thumbnail_url ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          src={product.thumbnail_url}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ImageIcon aria-hidden="true" className="size-4" />
        </div>
      )}
    </div>
  );
}

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  const publishedCount = products.filter(
    (product) => product.status === "published"
  ).length;
  const draftCount = products.filter((product) => product.status === "draft").length;
  const archivedCount = products.filter(
    (product) => product.status === "archived"
  ).length;
  const missingImagesCount = products.filter(
    (product) => !product.thumbnail_url
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Product management</p>
          <h1 className="text-3xl font-semibold tracking-normal">Products</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage catalog content, storefront thumbnails, downloadable files,
            and publishing status.
          </p>
        </div>

        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          New Product
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProductMetric label="Total products" value={String(products.length)} />
        <ProductMetric label="Published" value={String(publishedCount)} />
        <ProductMetric label="Drafts" value={String(draftCount)} />
        <ProductMetric label="Missing images" value={String(missingImagesCount)} />
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Catalog workspace
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Each row shows how ready a product is for the public storefront.
          </p>
        </div>

        {products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[42%]">Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductThumbnail product={product} />
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate font-medium">
                            {product.title}
                          </span>
                          <Badge variant="outline">
                            {productTypeLabels[product.product_type]}
                          </Badge>
                          {!product.thumbnail_url ? (
                            <Badge variant="secondary">Needs image</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {product.short_description ??
                            `/products/${product.slug}`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(product)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(product.status)}>
                      {statusLabels[product.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(product.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu label={`Actions for ${product.title}`}>
                      <AdminActionMenuLink
                        href={`/products/${product.slug}`}
                        icon="external-link"
                      >
                        View
                      </AdminActionMenuLink>
                      <AdminActionMenuLink
                        href={`/admin/products/${product.id}/files`}
                        icon="paperclip"
                      >
                        Files
                      </AdminActionMenuLink>
                      <AdminActionMenuLink
                        href={`/admin/products/${product.id}/edit`}
                        icon="pencil"
                      >
                        Edit
                      </AdminActionMenuLink>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <PackageCheckIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                No products yet
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Create your first product, upload a thumbnail, then attach the
                secure downloadable file.
              </p>
            </div>
            <Button
              render={<Link href="/admin/products/new" />}
              nativeButton={false}
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              New Product
            </Button>
          </div>
        )}
      </div>

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
