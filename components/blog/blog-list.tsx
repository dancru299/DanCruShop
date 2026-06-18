"use client";

import { useSearchParams } from "next/navigation";
import { BookOpenIcon } from "lucide-react";
import { BlogCard } from "./blog-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import type { PublishedBlogPost } from "@/lib/supabase/queries/blog";

type BlogListProps = {
  posts: PublishedBlogPost[];
  page: number;
  totalPages: number;
  total: number;
};

export function BlogList({ posts, page, totalPages, total }: BlogListProps) {
  const searchParams = useSearchParams();

  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }

    return `/blog?${params.toString()}`;
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={BookOpenIcon}
        title="Chưa có bài viết nào"
        description="Chúng tôi đang chuẩn bị nội dung mới, vui lòng quay lại sau."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      <div className="mt-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          labelFormat="posts"
          buildPageUrl={buildPageUrl}
        />
      </div>
    </div>
  );
}
