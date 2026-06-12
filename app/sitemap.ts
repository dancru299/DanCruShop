import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-config";
import {
  getBlogSitemapEntries,
  getProductSitemapEntries,
} from "@/lib/supabase/queries/sitemap";

// Regenerate hourly so newly published products/posts get indexed quickly.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${base}/refund-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${base}/delivery-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  const [products, posts] = await Promise.all([
    getProductSitemapEntries(),
    getBlogSitemapEntries(),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((entry) => ({
    url: `${base}/products/${entry.slug}`,
    lastModified: new Date(entry.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((entry) => ({
    url: `${base}/blog/${entry.slug}`,
    lastModified: new Date(entry.updatedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
