"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";

export function ProductViewTracker({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  useEffect(() => {
    trackAnalyticsEvent("product_view", {
      metadata: { slug },
      path: `/products/${slug}`,
      productId,
    });
  }, [productId, slug]);

  return null;
}
