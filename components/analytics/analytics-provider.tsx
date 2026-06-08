"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

import { trackAnalyticsEvent } from "@/lib/analytics/client";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const query = window.location.search.replace(/^\?/, "");
    const path = query ? `${pathname}?${query}` : pathname;

    trackAnalyticsEvent("page_view", { path });
  }, [pathname]);

  return children;
}
