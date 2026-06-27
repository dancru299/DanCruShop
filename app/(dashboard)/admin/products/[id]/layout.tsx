import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";

import { ProductWorkspaceTabs } from "@/components/admin/product-workspace-tabs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getAdminProductById,
  type ProductStatus,
} from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

type ProductWorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
};

const statusBadge: Record<
  ProductStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  archived: { label: "Lưu trữ", variant: "outline" },
  draft: { label: "Nháp", variant: "secondary" },
  published: { label: "Đã đăng", variant: "default" },
};

export const dynamic = "force-dynamic";

// Shared shell for every "manage one product" route. It anchors the admin in a
// single product (title + status + view-on-store) and exposes all management
// surfaces — overview, options, files, downloads, bundle, course — as tabs, so
// each surface stops being an isolated page with only a back link.
export default async function ProductWorkspaceLayout({
  children,
  params,
}: ProductWorkspaceLayoutProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  const status = statusBadge[product.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/products"
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Danh sách sản phẩm
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Sản phẩm</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal">
                {product.title}
              </h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>

          {product.status === "published" ? (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            >
              Xem trên cửa hàng
              <ExternalLinkIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
          ) : null}
        </div>

        <ProductWorkspaceTabs
          productId={product.id}
          productType={product.product_type}
        />
      </div>

      {children}
    </div>
  );
}
