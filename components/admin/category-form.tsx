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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryDetail } from "@/lib/supabase/queries/categories";
import { slugify } from "@/lib/utils";

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: CategoryDetail;
};

type CategoryFormErrors = {
  name?: string;
  slug?: string;
};

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(category?.description ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [errors, setErrors] = useState<CategoryFormErrors>({});

  function handleNameChange(value: string) {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function validate() {
    const nextErrors: CategoryFormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Vui lòng nhập tên danh mục.";
    }

    if (!slug.trim()) {
      nextErrors.slug = "Vui lòng nhập slug.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    startTransition(async () => {
      const payload = {
        description: description.trim() || null,
        icon: icon.trim() || null,
        imageUrl: imageUrl.trim() || null,
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

      toast.success(mode === "create" ? "Đã tạo danh mục." : "Đã lưu danh mục.");
      router.push("/admin/specs");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          variant="ghost"
          render={<Link href="/admin/specs" />}
          nativeButton={false}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Quay lại danh mục
        </Button>
        <h1 className="text-3xl font-semibold tracking-normal">
          {mode === "create" ? "Danh mục mới" : "Sửa danh mục"}
        </h1>
      </div>

      <section className="flex max-w-2xl flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="category-name">Tên</FieldLabel>
          <Input
            id="category-name"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Source code"
            aria-invalid={Boolean(errors.name)}
            disabled={isPending}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.slug)}>
          <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
          <Input
            id="category-slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="source-code"
            aria-invalid={Boolean(errors.slug)}
            disabled={isPending}
          />
          <FieldDescription>
            Dùng trong bộ lọc URL của storefront. Tự sinh từ tên.
          </FieldDescription>
          <FieldError>{errors.slug}</FieldError>
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

        <Field>
          <FieldLabel htmlFor="category-icon">Icon</FieldLabel>
          <Input
            id="category-icon"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="Sparkles"
            disabled={isPending}
          />
          <FieldDescription>
            Tên icon lucide (vd: Sparkles, Code2, BookOpen). Dùng cho section
            danh mục ở trang chủ khi không có ảnh.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="category-image">Ảnh (URL)</FieldLabel>
          <Input
            id="category-image"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
            disabled={isPending}
          />
          <FieldDescription>
            Ảnh đại diện danh mục (tùy chọn). Nếu có sẽ ưu tiên hơn icon.
          </FieldDescription>
        </Field>
      </section>

      <div className="flex max-w-2xl flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          render={<Link href="/admin/specs" />}
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
          {mode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
