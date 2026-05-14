import Link from "next/link";
import { PaperclipIcon, PencilIcon, PlusIcon } from "lucide-react";

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

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Product management</p>
          <h1 className="text-3xl font-semibold tracking-normal">Products</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage drafts, published products, and archived catalog items.
          </p>
        </div>

        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          New Product
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{product.title}</span>
                      <span className="text-xs text-muted-foreground">
                        /products/{product.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatPrice(product)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(product.status)}>
                      {statusLabels[product.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(product.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link href={`/admin/products/${product.id}/files`} />
                        }
                        nativeButton={false}
                      >
                        <PaperclipIcon
                          aria-hidden="true"
                          data-icon="inline-start"
                        />
                        Files
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link href={`/admin/products/${product.id}/edit`} />
                        }
                        nativeButton={false}
                      >
                        <PencilIcon
                          aria-hidden="true"
                          data-icon="inline-start"
                        />
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                No products yet
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Create your first product to start building the storefront
                catalog.
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
    </div>
  );
}
