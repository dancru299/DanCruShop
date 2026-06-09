"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/category.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminCategory } from "@/lib/supabase/queries/categories";
import { slugify } from "@/lib/utils";

type CategoryManagerProps = {
  categories: AdminCategory[];
};

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
  }

  function startEdit(category: AdminCategory) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setSlugTouched(true);
    setDescription(category.description ?? "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Nhập tên category.");
      return;
    }

    startTransition(async () => {
      const payload = {
        description: description.trim() || null,
        name: name.trim(),
        slug: slug.trim() || undefined,
      };
      const result = editingId
        ? await updateCategory(editingId, payload)
        : await createCategory(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(editingId ? "Đã cập nhật category." : "Đã tạo category.");
      resetForm();
      router.refresh();
    });
  }

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

      if (editingId === category.id) {
        resetForm();
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <form
        onSubmit={handleSubmit}
        className="flex h-fit flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm lg:sticky lg:top-24"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal">
            {editingId ? "Sửa category" : "Category mới"}
          </h2>
          {editingId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetForm}
              disabled={isPending}
            >
              <XIcon aria-hidden="true" data-icon="inline-start" />
              Hủy
            </Button>
          ) : null}
        </div>

        <Field>
          <FieldLabel htmlFor="category-name">Tên</FieldLabel>
          <Input
            id="category-name"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Source code"
            disabled={isPending}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
          <Input
            id="category-slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="source-code"
            disabled={isPending}
          />
          <FieldDescription>Dùng trong bộ lọc URL của storefront.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="category-description">Mô tả</FieldLabel>
          <Textarea
            id="category-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Mô tả ngắn (tùy chọn)."
            disabled={isPending}
          />
        </Field>

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {editingId ? "Lưu thay đổi" : "Tạo category"}
        </Button>
      </form>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Tất cả category
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {categories.length} category đang dùng để phân loại sản phẩm.
          </p>
        </div>

        {categories.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        /{category.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.product_count}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(category)}
                        disabled={isPending}
                      >
                        <PencilIcon aria-hidden="true" data-icon="inline-start" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(category)}
                        disabled={isPending}
                      >
                        <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-medium">Chưa có category</p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Tạo category đầu tiên ở form bên trái để khách lọc sản phẩm theo
              chủ đề.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
