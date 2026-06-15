/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { BannerGridSection as BannerGridConfig } from "@/lib/store/home-layout";

export function BannerGridSection({
  section,
}: {
  section: BannerGridConfig;
}) {
  const items = section.items.filter((item) => item.imageUrl.trim().length > 0);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-24 border-b border-border/80 py-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:auto-rows-[minmax(0,11rem)]">
          {items.map((item, index) => (
            <Link
              key={`${item.imageUrl}-${index}`}
              href={item.href || "#"}
              aria-label={item.title || "Banner"}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                // First banner is the hero cell of the bento grid.
                index === 0 && "col-span-2 row-span-2"
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
