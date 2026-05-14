/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import type { PublishedBlogPost } from "@/lib/supabase/queries/blog";

type BlogCardProps = {
  post: PublishedBlogPost;
};

function formatDate(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value ?? fallback));
}

export function BlogCard({ post }: BlogCardProps) {
  const coverSrc = post.cover_image_url ?? "/window.svg";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-ring/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={coverSrc}
          alt={post.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
            className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          />
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {post.excerpt ??
            "Practical notes for creators building and selling digital products."}
        </p>
      </div>
    </Link>
  );
}
