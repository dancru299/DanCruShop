"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { TagIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteCategory } from "@/actions/category.actions";
import {
  AdminActionMenu,
  AdminActionMenuButton,
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
import type { AdminCategory } from "@/lib/supabase/queries/categories";

type CategoryTableProps = {
  categories: AdminCategory[];
};

export function CategoryTable({ categories }: CategoryTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.slug.toLowerCase().includes(term)
    );
  }, [categories, query]);

  function handleDelete(category: AdminCategory) {
    if (
      !window.confirm(
        `Xóa category "${category.name}"? Sản phẩm sẽ bị gỡ khỏi category này.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCategory(category.id);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã xóa category.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm category theo tên hoặc slug..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Tất cả category
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {filtered.length}/{categories.length} category đang hiển thị.
          </p>
        </div>

        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      /{category.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.product_count}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu label={`Thao tác cho ${category.name}`}>
                      <AdminActionMenuLink
                        href={`/admin/categories/${category.id}/edit`}
                        icon="pencil"
                      >
                        Sửa
                      </AdminActionMenuLink>
                      <AdminActionMenuButton
                        icon="trash"
                        tone="destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(category)}
                      >
                        Xóa
                      </AdminActionMenuButton>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <TagIcon aria-hidden="true" className="size-5" />
            </div>
            <p className="text-sm font-medium">
              {categories.length === 0
                ? "Chưa có category"
                : "Không tìm thấy category khớp tìm kiếm"}
            </p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Tạo category để khách lọc sản phẩm theo chủ đề.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
