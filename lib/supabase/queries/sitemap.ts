import { createAdminClient } from "@/lib/supabase/admin";

export type SitemapEntry = {
  slug: string;
  updatedAt: string;
};

// Uses the service-role client so the sitemap can be generated without a request
// cookie context (ISR/revalidation). Always filters to published rows.
export async function getProductSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Failed to load product sitemap entries", error);
      return [];
    }

    return ((data ?? []) as { slug: string; updated_at: string }[]).map(
      (row) => ({ slug: row.slug, updatedAt: row.updated_at })
    );
  } catch (error) {
    console.error("Unexpected error while loading product sitemap", error);
    return [];
  }
}

export async function getBlogSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Failed to load blog sitemap entries", error);
      return [];
    }

    return ((data ?? []) as { slug: string; updated_at: string }[]).map(
      (row) => ({ slug: row.slug, updatedAt: row.updated_at })
    );
  } catch (error) {
    console.error("Unexpected error while loading blog sitemap", error);
    return [];
  }
}
