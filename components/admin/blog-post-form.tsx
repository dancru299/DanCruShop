"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  SaveIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBlogPost,
  getBlogPreviewUrl,
  updateBlogPost,
  type BlogPostInsert,
  type BlogPostUpdate,
} from "@/actions/blog.actions";
import { AdminMediaUploadField } from "@/components/admin/media-upload-field";
import { BlogCoverArtwork } from "@/components/blog/blog-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  PublishedBlogPost,
} from "@/lib/supabase/queries/blog";

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

const statusBadgeVariants: Record<BlogPostStatus, "default" | "outline" | "secondary"> = {
  archived: "outline",
  draft: "secondary",
  published: "default",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

function getPlainPreview(content: string) {
  return (
    content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*_`>~-]/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" ") || "Start writing to preview the first paragraph here."
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function BlogPreviewPanel({
  content,
  coverImageUrl,
  createdAt,
  excerpt,
  seoDescription,
  seoTitle,
  slug,
  status,
  title,
}: {
  content: string;
  coverImageUrl: string;
  createdAt: string;
  excerpt: string;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  status: BlogPostStatus;
  title: string;
}) {
  const previewPost: PublishedBlogPost = {
    cover_image_url: coverImageUrl.trim() || null,
    created_at: createdAt,
    excerpt: excerpt.trim() || null,
    id: "preview",
    published_at: status === "published" ? createdAt : null,
    slug: slug || "post-slug",
    title: title.trim() || "Untitled post",
  };
  const readingTime = getReadingTime(content);

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {previewPost.cover_image_url ? (
            <img
              alt={previewPost.title}
              className="absolute inset-0 size-full object-cover"
              src={previewPost.cover_image_url}
            />
          ) : (
            <BlogCoverArtwork post={previewPost} />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-4">
            <Badge variant={statusBadgeVariants[status]}>{status}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {formatDate(createdAt)} - {readingTime} min read
              </p>
              <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-7 tracking-normal">
                {previewPost.title}
              </h2>
            </div>
            <ArrowUpRightIcon
              aria-hidden="true"
              className="mt-1 shrink-0 text-muted-foreground"
            />
          </div>

          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {previewPost.excerpt ??
              "A concise excerpt will make blog cards more compelling."}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Article preview</h3>
            <p className="text-xs text-muted-foreground">
              /blog/{previewPost.slug}
            </p>
          </div>
          <Badge variant="outline">Markdown</Badge>
        </div>

        <div className="mt-4 rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Opening paragraph</p>
          <p className="mt-2 line-clamp-4 text-xs leading-5">
            {getPlainPreview(content)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <SearchIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">SEO preview</h3>
        </div>
        <p className="line-clamp-1 text-sm font-medium text-sky-400">
          {seoTitle.trim() || title.trim() || "Search result title"}
        </p>
        <p className="mt-1 text-xs text-emerald-400">
          dancrushop.com/blog/{previewPost.slug}
        </p>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
          {seoDescription.trim() ||
            excerpt.trim() ||
            "Add an SEO description or excerpt to control the search snippet."}
        </p>
      </div>
    </aside>
  );
}

export function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createdAt] = useState(
    () => post?.created_at ?? new Date().toISOString()
  );
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
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const submitLabel = useMemo(
    () => (mode === "create" ? "Create post" : "Save changes"),
    [mode]
  );

  async function handlePreview() {
    if (!post?.id || isLoadingPreview) return;

    setIsLoadingPreview(true);

    try {
      const url = await getBlogPreviewUrl(post.id);

      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not generate preview URL.");
    } finally {
      setIsLoadingPreview(false);
    }
  }

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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          variant="ghost"
          render={<Link href="/admin/blog" />}
          nativeButton={false}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Back to posts
        </Button>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-normal">
            {mode === "create" ? "Write New Post" : "Edit Post"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Draft the article, tune SEO, upload a cover, and preview the public
            blog card while you write.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-normal">
                  Article basics
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Title, URL, excerpt, and publish state for the public blog.
                </p>
              </div>
              <Badge variant={statusBadgeVariants[status]}>{status}</Badge>
            </div>

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

              <div className="grid gap-5 md:grid-cols-[1fr_14rem]">
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
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as BlogPostStatus)
                    }
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
            </FieldGroup>
          </section>

          <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold tracking-normal">
                Cover image
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Upload the visual used in blog cards and article headers.
              </p>
            </div>

            <AdminMediaUploadField
              description="Recommended ratio: 16:9. Images are uploaded to the public media bucket."
              disabled={isPending}
              folder="blog"
              id="cover-image-url"
              label="Cover image URL"
              onChange={setCoverImageUrl}
              placeholder="https://example.com/cover.jpg"
              value={coverImageUrl}
            />
          </section>

          <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-normal">
                  Content
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Write in Markdown. The side preview shows the public opening
                  snippet and reading time.
                </p>
              </div>
              <FileTextIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            </div>

            <FieldGroup>
              <Field data-invalid={Boolean(errors.content)}>
                <FieldLabel htmlFor="content">Content (Markdown)</FieldLabel>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={
                    "## Start writing\n\nUse Markdown for headings, links, lists, and code blocks."
                  }
                  className="min-h-[28rem] font-mono text-sm"
                  aria-invalid={Boolean(errors.content)}
                  disabled={isPending}
                />
                <FieldError>{errors.content}</FieldError>
              </Field>
            </FieldGroup>
          </section>

          <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold tracking-normal">
                SEO metadata
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Optional fields for search previews and social snippets.
              </p>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="seo-title">SEO title</FieldLabel>
                <Input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder="Optional custom search title"
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="seo-description">
                  SEO description
                </FieldLabel>
                <Textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  placeholder="Optional meta description"
                  disabled={isPending}
                />
              </Field>
            </FieldGroup>
          </section>
        </div>

        <BlogPreviewPanel
          content={content}
          coverImageUrl={coverImageUrl}
          createdAt={createdAt}
          excerpt={excerpt}
          seoDescription={seoDescription}
          seoTitle={seoTitle}
          slug={slug}
          status={status}
          title={title}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          render={<Link href="/admin/blog" />}
          nativeButton={false}
          disabled={isPending}
        >
          Cancel
        </Button>
        {mode === "edit" && post?.id ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending || isLoadingPreview}
            onClick={handlePreview}
          >
            {isLoadingPreview ? (
              <Loader2Icon
                aria-hidden="true"
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <ExternalLinkIcon aria-hidden="true" data-icon="inline-start" />
            )}
            {isLoadingPreview ? "Generating..." : "Preview"}
          </Button>
        ) : null}
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
