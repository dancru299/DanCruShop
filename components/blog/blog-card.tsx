/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRightIcon, BookOpenIcon, CalendarDaysIcon } from "lucide-react";

import type { PublishedBlogPost } from "@/lib/supabase/queries/blog";

type BlogCardProps = {
  post: PublishedBlogPost;
};

function formatDate(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value ?? fallback));
}

export function BlogCoverArtwork({ post }: BlogCardProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_calc(100%-1px),var(--border)_calc(100%-1px)),linear-gradient(to_bottom,transparent_0,transparent_calc(100%-1px),var(--border)_calc(100%-1px))] bg-[size:32px_32px] opacity-20" />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              DanCruShop Notes
            </span>
            <span className="line-clamp-2 text-sm font-semibold">
              {post.title}
            </span>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg border bg-background/70 text-foreground shadow-sm backdrop-blur">
            <BookOpenIcon aria-hidden="true" className="size-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDaysIcon aria-hidden="true" className="size-3.5" />
          {formatDate(post.published_at, post.created_at)}
        </div>
      </div>
    </div>
  );
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group/blog-card flex h-full flex-col overflow-hidden rounded-lg border bg-card/65 text-card-foreground shadow-sm backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-xl hover:shadow-foreground/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/blog-card:scale-105"
          />
        ) : (
          <BlogCoverArtwork post={post} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/blog-card:opacity-100" />
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-foreground/15 to-transparent opacity-0 transition-all duration-700 group-hover/blog-card:left-full group-hover/blog-card:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              {formatDate(post.published_at, post.created_at)}
            </p>
            <h2 className="line-clamp-2 text-lg font-semibold leading-7 tracking-normal">
              {post.title}
            </h2>
          </div>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="mt-1 shrink-0 text-muted-foreground transition-[color,transform] duration-300 group-hover/blog-card:-translate-y-0.5 group-hover/blog-card:translate-x-0.5 group-hover/blog-card:text-foreground"
          />
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {post.excerpt ??
            "Ghi chú thực chiến cho creator đang xây và bán sản phẩm số."}
        </p>
      </div>
    </Link>
  );
}
