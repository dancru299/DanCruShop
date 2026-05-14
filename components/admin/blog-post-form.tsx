"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeftIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createBlogPost,
  updateBlogPost,
  type BlogPostInsert,
  type BlogPostUpdate,
} from "@/actions/blog.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminBlogPost,
  BlogPostStatus,
} from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

type BlogPostFormMode = "create" | "edit";

type BlogPostFormProps = {
  mode: BlogPostFormMode;
  post?: AdminBlogPost;
};

type BlogPostFormErrors = {
  content?: string;
  slug?: string;
  title?: string;
};

const statusOptions: Array<{
  label: string;
  value: BlogPostStatus;
}> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    post?.cover_image_url ?? ""
  );
  const [status, setStatus] = useState<BlogPostStatus>(
    post?.status ?? "draft"
  );
  const [content, setContent] = useState(post?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    post?.seo_description ?? ""
  );
  const [errors, setErrors] = useState<BlogPostFormErrors>({});

  const submitLabel = useMemo(
    () => (mode === "create" ? "Create post" : "Save changes"),
    [mode]
  );

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function validate() {
    const nextErrors: BlogPostFormErrors = {};
    const normalizedSlug = slugify(slug);

    if (!title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!normalizedSlug) {
      nextErrors.slug = "Slug is required.";
    }

    if (!content.trim()) {
      nextErrors.content = "Markdown content is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return { normalizedSlug };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validated = validate();

    if (!validated) {
      return;
    }

    const payload: BlogPostInsert = {
      content: content.trim(),
      cover_image_url: coverImageUrl.trim() || null,
      excerpt: excerpt.trim() || null,
      seo_description: seoDescription.trim() || null,
      seo_title: seoTitle.trim() || null,
      slug: validated.normalizedSlug,
      status,
      title: title.trim(),
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createBlogPost(payload)
          : await updateBlogPost(post?.id ?? "", payload satisfies BlogPostUpdate);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "create" ? "Post created." : "Post updated.");
      router.push("/admin/blog");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-4xl flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/blog"
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Back to posts
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-normal">
            {mode === "create" ? "Write New Post" : "Edit Post"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Draft content in Markdown, tune SEO fields, and publish when ready.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="How to ship digital products faster"
              aria-invalid={Boolean(errors.title)}
              disabled={isPending}
            />
            <FieldError>{errors.title}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.slug)}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input
              id="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder="ship-digital-products-faster"
              aria-invalid={Boolean(errors.slug)}
              disabled={isPending}
            />
            <FieldDescription>
              Used in the public URL. It is auto-generated from the title.
            </FieldDescription>
            <FieldError>{errors.slug}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="excerpt">Excerpt</FieldLabel>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="A concise summary for blog cards and previews."
              disabled={isPending}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-[1fr_14rem]">
            <Field>
              <FieldLabel htmlFor="cover-image-url">Cover Image URL</FieldLabel>
              <Input
                id="cover-image-url"
                value={coverImageUrl}
                onChange={(event) => setCoverImageUrl(event.target.value)}
                placeholder="https://example.com/cover.jpg"
                disabled={isPending}
              />
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as BlogPostStatus)}
              >
                <SelectTrigger className="w-full" disabled={isPending}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.content)}>
            <FieldLabel htmlFor="content">Content (Markdown)</FieldLabel>
            <Textarea
              id="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={"## Start writing\n\nUse Markdown for headings, links, lists, and code blocks."}
              className="min-h-96 font-mono text-sm"
              aria-invalid={Boolean(errors.content)}
              disabled={isPending}
            />
            <FieldError>{errors.content}</FieldError>
          </Field>
        </FieldGroup>
      </div>

      <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="seo-title">SEO Title</FieldLabel>
              <Input
                id="seo-title"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                placeholder="Optional custom search title"
                disabled={isPending}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="seo-description">SEO Description</FieldLabel>
              <Input
                id="seo-description"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                placeholder="Optional meta description"
                disabled={isPending}
              />
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/admin/blog"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancel
        </Link>
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
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
