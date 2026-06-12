import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/checkout",
        "/vietqr",
        "/cart",
        "/profile",
        "/settings",
        "/favorites",
        "/login",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
