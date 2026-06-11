"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import { generatePreviewToken } from "@/lib/blog/preview-token";
import { getSiteUrl } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";
import type { BlogPostStatus } from "@/lib/supabase/queries/blog";

const blogPostStatuses = [
  "draft",
  "published",
  "archived",
] as const satisfies readonly BlogPostStatus[];

export type BlogPostInsert = {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  status: BlogPostStatus;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type BlogPostUpdate = Partial<BlogPostInsert>;

export type BlogPostActionResult =
  | {
      ok: true;
      postId: string;
    }
  | {
      ok: false;
      error: string;
    };

type BlogPostPayload = Record<string, unknown>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function isBlogPostStatus(value: unknown): value is BlogPostStatus {
  return (
    typeof value === "string" &&
    blogPostStatuses.includes(value as BlogPostStatus)
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizeBlogPostInsert(data: BlogPostInsert): BlogPostPayload {
  const title = data.title.trim();
  const slug = slugify(data.slug || data.title);

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!slug) {
    throw new Error("Slug is required.");
  }

  if (!isBlogPostStatus(data.status)) {
    throw new Error("Status is invalid.");
  }

  return {
    title,
    slug,
    excerpt: nullableText(data.excerpt),
    content: nullableText(data.content),
    cover_image_url: nullableText(data.cover_image_url),
    status: data.status,
    seo_title: nullableText(data.seo_title),
    seo_description: nullableText(data.seo_description),
    published_at:
      data.status === "published" ? new Date().toISOString() : null,
  };
}

function normalizeBlogPostUpdate(data: BlogPostUpdate): BlogPostPayload {
  const payload: BlogPostPayload = {};

  if ("title" in data) {
    const title = data.title?.trim();

    if (!title) {
      throw new Error("Title is required.");
    }

    payload.title = title;
  }

  if ("slug" in data) {
    const slug = slugify(data.slug ?? "");

    if (!slug) {
      throw new Error("Slug is required.");
    }

    payload.slug = slug;
  }

  if ("excerpt" in data) {
    payload.excerpt = nullableText(data.excerpt);
  }

  if ("content" in data) {
    payload.content = nullableText(data.content);
  }

  if ("cover_image_url" in data) {
    payload.cover_image_url = nullableText(data.cover_image_url);
  }

  if ("status" in data) {
    if (!isBlogPostStatus(data.status)) {
      throw new Error("Status is invalid.");
    }

    payload.status = data.status;
  }

  if ("seo_title" in data) {
    payload.seo_title = nullableText(data.seo_title);
  }

  if ("seo_description" in data) {
    payload.seo_description = nullableText(data.seo_description);
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No blog post fields were provided.");
  }

  return payload;
}

function revalidateBlogSurfaces(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/admin/blog");

  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function createBlogPost(
  data: BlogPostInsert
): Promise<BlogPostActionResult> {
  try {
    await requireAdmin();

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Admin session is required.");
    }

    const payload = normalizeBlogPostInsert(data);
    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        ...payload,
        author_id: user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create blog post", error);
      return { ok: false, error: error.message };
    }

    revalidateBlogSurfaces(String(payload.slug));

    return { ok: true, postId: String(post.id) };
  } catch (error) {
    console.error("Unexpected error while creating blog post", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getBlogPreviewUrl(postId: string): Promise<string> {
  await requireAdmin();

  const token = generatePreviewToken(postId.trim());

  return `${getSiteUrl()}/blog/preview/${postId.trim()}?token=${token}`;
}

export async function updateBlogPost(
  id: string,
  data: BlogPostUpdate
): Promise<BlogPostActionResult> {
  try {
    await requireAdmin();

    const postId = id.trim();

    if (!postId) {
      throw new Error("Blog post id is required.");
    }

    const payload = normalizeBlogPostUpdate(data);
    const supabase = await createClient();

    if (payload.status === "published") {
      const { data: currentPost, error: loadError } = await supabase
        .from("blog_posts")
        .select("published_at")
        .eq("id", postId)
        .maybeSingle();

      if (loadError) {
        console.error("Failed to load blog post before publish", loadError);
        return { ok: false, error: loadError.message };
      }

      if (!currentPost?.published_at) {
        payload.published_at = new Date().toISOString();
      }
    } else if (payload.status === "draft" || payload.status === "archived") {
      payload.published_at = null;
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", postId)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to update blog post", error);
      return { ok: false, error: error.message };
    }

    revalidateBlogSurfaces(
      typeof payload.slug === "string" ? payload.slug : undefined
    );

    return { ok: true, postId: String(post.id) };
  } catch (error) {
    console.error("Unexpected error while updating blog post", error);
    return { ok: false, error: getErrorMessage(error) };
  }
}
