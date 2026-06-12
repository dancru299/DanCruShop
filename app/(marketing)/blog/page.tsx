import type { Metadata } from "next";
import Link from "next/link";

import { BlogCard } from "@/components/blog/blog-card";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedPosts } from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

const blogDescription =
  "Ghi chú triển khai, launch notes và bài viết thực tế về storefront sản phẩm số trên DanCruShop.";

export const metadata: Metadata = {
  title: "Bài viết",
  description: blogDescription,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Bài viết | DanCruShop",
    description: blogDescription,
    url: "/blog",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-12 md:py-16">
          <p className="text-sm font-medium uppercase tracking-normal text-muted-foreground">
            DanCruShop Notes
          </p>
          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance md:text-6xl">
              Bài viết giúp builder bán sản phẩm tốt hơn.
            </h1>
            <p className="text-base leading-8 text-muted-foreground md:text-lg">
              Ghi chú triển khai, launch notes và hướng dẫn kỹ thuật dành cho
              người đang xây storefront, tool và sản phẩm số có doanh thu thật.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
        {posts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center gap-5 rounded-lg border bg-card/60 backdrop-blur-xl p-8 text-center text-card-foreground shadow-sm">
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Chưa có bài viết nào
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Khi bài mới được publish từ CMS, danh sách sẽ hiện tại đây.
              </p>
            </div>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
              Quay về storefront
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
