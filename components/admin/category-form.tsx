"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeftIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createCategory,
  updateCategory,
} from "@/actions/category.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryDetail } from "@/lib/supabase/queries/categories";
import { slugify } from "@/lib/utils";

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: CategoryDetail;
};

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(category?.description ?? "");

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
      const result =
        mode === "create"
          ? await createCategory(payload)
          : await updateCategory(category?.id ?? "", payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "create" ? "Đã tạo category." : "Đã lưu category.");
      router.push("/admin/categories");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          variant="ghost"
          render={<Link href="/admin/categories" />}
          nativeButton={false}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Quay lại Categories
        </Button>
        <h1 className="text-3xl font-semibold tracking-normal">
          {mode === "create" ? "Category mới" : "Sửa category"}
        </h1>
      </div>

      <section className="flex max-w-2xl flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
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
          <FieldDescription>
            Dùng trong bộ lọc URL của storefront. Tự sinh từ tên.
          </FieldDescription>
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
      </section>

      <div className="flex max-w-2xl flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          render={<Link href="/admin/categories" />}
          nativeButton={false}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <SaveIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {mode === "create" ? "Tạo category" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
