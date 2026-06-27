"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ImageIcon, PackageIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

import {
  AdminActionMenu,
  AdminActionMenuLink,
} from "@/components/admin/admin-action-menu";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminProductListItem } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

type ProductsTableProps = {
  products: AdminProductListItem[];
};

const statusLabels: Record<AdminProductListItem["status"], string> = {
  archived: "Đã lưu trữ",
  draft: "Bản nháp",
  published: "Đã xuất bản",
};

const productTypeLabels: Record<AdminProductListItem["product_type"], string> = {
  bundle: "Bộ",
  course: "Khóa học",
  digital_download: "Tải về",
  free_resource: "Miễn phí",
  template: "Mẫu",
  tool: "Công cụ",
};

function formatPrice(product: AdminProductListItem) {
  if (product.is_free) {
    return "Miễn phí";
  }

  const currency = product.currency.trim().toUpperCase() || "USD";
  const amount =
    currency === "VND" ? product.price_cents : product.price_cents / 100;

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
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(value)
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

function ProductActions({ product }: { product: AdminProductListItem }) {
  return (
    <AdminActionMenu label={`Thao tác cho ${product.title}`}>
      <AdminActionMenuLink href={`/products/${product.slug}`} icon="external-link">
        Xem
      </AdminActionMenuLink>
      <AdminActionMenuLink
        href={`/admin/products/${product.id}/options`}
        icon="paperclip"
      >
        Phiên bản &amp; file
      </AdminActionMenuLink>
      {product.product_type === "bundle" ? (
        <AdminActionMenuLink
          href={`/admin/products/${product.id}/bundle`}
          icon="bundle"
        >
          Bộ sản phẩm
        </AdminActionMenuLink>
      ) : null}
      <AdminActionMenuLink
        href={`/admin/products/${product.id}/edit`}
        icon="pencil"
      >
        Sửa
      </AdminActionMenuLink>
    </AdminActionMenu>
  );
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(term) ||
        product.slug.toLowerCase().includes(term) ||
        product.short_description?.toLowerCase().includes(term)
    );
  }, [products, query]);

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm sản phẩm theo tên hoặc slug..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Kho sản phẩm
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {filtered.length}/{products.length} sản phẩm đang hiển thị.
          </p>
        </div>

        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[42%]">Sản phẩm</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đã cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
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
                            <Badge variant="secondary">Cần ảnh</Badge>
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
                  <TableCell className={cn("text-muted-foreground")}>
                    {formatDate(product.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductActions product={product} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={PackageIcon}
              title={
                products.length === 0
                  ? "Chưa có sản phẩm nào"
                  : "Không tìm thấy sản phẩm khớp tìm kiếm"
              }
              description={
                products.length === 0
                  ? "Tạo sản phẩm đầu tiên để bắt đầu bán hàng."
                  : "Vui lòng thử tìm kiếm bằng từ khóa khác."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
