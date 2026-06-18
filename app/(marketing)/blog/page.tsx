import type { Metadata } from "next";
import Link from "next/link";

import { BookOpenIcon } from "lucide-react";

import { BlogCard } from "@/components/blog/blog-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedPosts } from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

const blogDescription =
  "Implementation notes, launch notes, and practical articles about running a digital-product storefront on DanCruShop.";

export const metadata: Metadata = {
  title: "Blog",
  description: blogDescription,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog | DanCruShop",
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
              Articles to help builders sell better.
            </h1>
            <p className="text-base leading-8 text-muted-foreground md:text-lg">
              Implementation notes, launch notes, and technical guides for
              people building storefronts, tools, and digital products with real
              revenue.
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
          <EmptyState
            icon={BookOpenIcon}
            title="No articles yet"
            description="When new posts are published from the CMS, they'll show up here."
            action={
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to storefront
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
