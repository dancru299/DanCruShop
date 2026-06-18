/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon, GitCompareIcon, XIcon } from "lucide-react";

import { useCompare } from "@/components/compare/compare-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CompareBar() {
  const pathname = usePathname();
  const { items, count, max, clear, remove, isLoaded } = useCompare();

  // Slides away when empty or while already on the compare page.
  const shouldShow = isLoaded && count > 0 && pathname !== "/compare";
  const canCompare = count >= 2;
  const compareHref = `/compare?items=${items
    .map((item) => encodeURIComponent(item.slug))
    .join(",")}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div
        aria-hidden={!shouldShow}
        className={cn(
          "pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-background/70 p-3 shadow-2xl shadow-foreground/10 backdrop-blur-xl transition-all duration-300 motion-reduce:transition-none",
          shouldShow
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-[150%] opacity-0"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex items-center -space-x-2">
            {items.map((item) => (
              <span
                key={item.id}
                className="group/thumb relative size-11 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-sm"
                title={item.title}
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <GitCompareIcon aria-hidden="true" className="size-4" />
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => remove(item.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity hover:opacity-100"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </button>
              </span>
            ))}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {count}/{max} products selected
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {canCompare
                ? "Ready for technical comparison"
                : "Select at least 2 products to compare"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clear}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear all
        </button>

        <Link
          href={compareHref}
          aria-disabled={!canCompare}
          tabIndex={canCompare ? undefined : -1}
          className={cn(
            buttonVariants({ size: "sm" }),
            "shrink-0 rounded-lg",
            !canCompare && "pointer-events-none opacity-50"
          )}
        >
          Compare now
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Link>
      </div>
    </div>
  );
}
