import { createClient } from "@/lib/supabase/server";

export type BlogPostStatus = "draft" | "published" | "archived";

export type PublishedBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
};

export type BlogPostDetail = PublishedBlogPost & {
  content: string | null;
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: BlogPostStatus;
  updated_at: string;
};

export type AdminBlogPostListItem = PublishedBlogPost & {
  status: BlogPostStatus;
  updated_at: string;
};

export type AdminBlogPost = BlogPostDetail;

const publicPostListSelect = `
  id,
  title,
  slug,
  excerpt,
  cover_image_url,
  published_at,
  created_at
`;

const postDetailSelect = `
  id,
  title,
  slug,
  excerpt,
  content,
  cover_image_url,
  status,
  author_id,
  seo_title,
  seo_description,
  published_at,
  created_at,
  updated_at
`;

const adminPostListSelect = `
  id,
  title,
  slug,
  excerpt,
  cover_image_url,
  status,
  published_at,
  created_at,
  updated_at
`;

function getVisiblePublishedFilter() {
  return `published_at.is.null,published_at.lte.${new Date().toISOString()}`;
}

export async function getPublishedPosts(): Promise<PublishedBlogPost[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(publicPostListSelect)
      .eq("status", "published")
      .or(getVisiblePublishedFilter())
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch published blog posts", error);
      return [];
    }

    return (data ?? []) as PublishedBlogPost[];
  } catch (error) {
    console.error("Unexpected error while fetching published blog posts", error);
    return [];
  }
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPostDetail | null> {
  try {
    const normalizedSlug = slug.trim();

    if (!normalizedSlug) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(postDetailSelect)
      .eq("slug", normalizedSlug)
      .eq("status", "published")
      .or(getVisiblePublishedFilter())
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch blog post by slug", error);
      return null;
    }

    return data as BlogPostDetail | null;
  } catch (error) {
    console.error("Unexpected error while fetching blog post by slug", error);
    return null;
  }
}

export async function getAdminBlogPosts(): Promise<AdminBlogPostListItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(adminPostListSelect)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin blog posts", error);
      return [];
    }

    return (data ?? []) as AdminBlogPostListItem[];
  } catch (error) {
    console.error("Unexpected error while fetching admin blog posts", error);
    return [];
  }
}

export async function getAdminBlogPostById(
  id: string
): Promise<AdminBlogPost | null> {
  try {
    const normalizedId = id.trim();

    if (!normalizedId) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(postDetailSelect)
      .eq("id", normalizedId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch admin blog post by id", error);
      return null;
    }

    return data as AdminBlogPost | null;
  } catch (error) {
    console.error("Unexpected error while fetching admin blog post by id", error);
    return null;
  }
}
