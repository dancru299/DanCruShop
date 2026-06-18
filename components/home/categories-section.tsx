/* eslint-disable @next/next/no-img-element */

import { createElement } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { TagIcon, type LucideIcon } from "lucide-react";

import {
  getHomeCategories,
  type HomeCategory,
} from "@/lib/supabase/queries/categories";
import { SectionHeader } from "@/components/home/section-header";
import { cn } from "@/lib/utils";
import type {
  CategoriesSection as CategoriesConfig,
  ColumnCount,
} from "@/lib/store/home-layout";

const GRID_COLUMNS: Record<ColumnCount, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 xl:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

function resolveIcon(name: string | null): LucideIcon {
  if (!name) {
    return TagIcon;
  }

  const candidate = (LucideIcons as unknown as Record<string, unknown>)[name];

  return typeof candidate === "function" ? (candidate as LucideIcon) : TagIcon;
}

function CategoryCard({ category }: { category: HomeCategory }) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/80 bg-card/55 p-4 text-card-foreground shadow-sm backdrop-blur-xl transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-primary/60 via-transparent to-transparent" />
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-background text-foreground shadow-sm">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="size-full object-cover"
          />
        ) : (
          createElement(resolveIcon(category.icon), {
            "aria-hidden": "true",
            className: "size-5",
          })
        )}
      </div>

      <h3 className="min-w-0 truncate text-base font-semibold">{category.name}</h3>
    </Link>
  );
}

export async function CategoriesSection({
  section,
}: {
  section: CategoriesConfig;
}) {
  const all = await getHomeCategories();
  const categories =
    section.source === "selected" && section.categoryIds.length > 0
      ? all.filter((category) => section.categoryIds.includes(category.id))
      : all;

  if (categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="scroll-mt-24 border-b border-border/80 py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <SectionHeader
          title={section.title}
          description={section.description}
          actionLabel={section.actionLabel}
          actionHref={section.actionHref}
        />

        {section.layout === "row" ? (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="w-[70%] shrink-0 snap-start sm:w-64"
              >
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn("grid gap-3", GRID_COLUMNS[section.columns])}>
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
