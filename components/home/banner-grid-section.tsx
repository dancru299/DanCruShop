/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { BannerGridSection as BannerGridConfig } from "@/lib/store/home-layout";

// Pick a balanced bento layout for the given number of banners. A single fixed
// 4-col grid with a 2x2 hero cell only looks right at 5+ items; with 2–4 it
// leaves dead columns or a lonely small tile. Each case returns the grid track
// classes plus a per-item span function so every count tiles cleanly.
function bentoLayout(count: number): {
  grid: string;
  itemSpan: (index: number) => string;
} {
  switch (count) {
    case 1:
      return {
        grid: "grid-cols-1 md:auto-rows-[minmax(0,18rem)]",
        itemSpan: () => "",
      };
    case 2:
      return {
        grid: "grid-cols-1 sm:grid-cols-2 md:auto-rows-[minmax(0,15rem)]",
        itemSpan: () => "",
      };
    case 3:
      // Tall hero on the left, two stacked tiles on the right.
      return {
        grid: "grid-cols-2 md:auto-rows-[minmax(0,8.5rem)]",
        itemSpan: (index) => (index === 0 ? "row-span-2" : ""),
      };
    case 4:
      // Even 2x2 quad.
      return {
        grid: "grid-cols-2 md:auto-rows-[minmax(0,11rem)]",
        itemSpan: () => "",
      };
    default:
      // 5+: full bento with a 2x2 hero cell and the rest flowing as 1x1.
      return {
        grid: "grid-cols-2 md:grid-cols-4 md:auto-rows-[minmax(0,11rem)]",
        itemSpan: (index) => (index === 0 ? "col-span-2 row-span-2" : ""),
      };
  }
}

export function BannerGridSection({
  section,
}: {
  section: BannerGridConfig;
}) {
  const items = section.items.filter((item) => item.imageUrl.trim().length > 0);

  if (items.length === 0) {
    return null;
  }

  const layout = bentoLayout(items.length);

  return (
    <section className="scroll-mt-24 border-b border-border/80 py-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className={cn("grid gap-4", layout.grid)}>
          {items.map((item, index) => (
            <Link
              key={`${item.imageUrl}-${index}`}
              href={item.href || "#"}
              aria-label={item.title || "Banner"}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                layout.itemSpan(index)
              )}
            >
              <img
                src={item.imageUrl}
                alt={item.title || ""}
                className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {item.title ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <span className="text-sm font-semibold text-white drop-shadow">
                    {item.title}
                  </span>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
