import Link from "next/link";

import { BlogCard } from "@/components/blog/blog-card";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedPosts } from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Blog",
  description:
    "Read practical notes on digital products, storefronts, and creator commerce from DanCruShop.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="bg-background">
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-12 md:py-16">
          <p className="text-sm font-medium uppercase tracking-normal text-muted-foreground">
            DanCruShop Blog
          </p>
          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance md:text-6xl">
              Guides for selling better digital products.
            </h1>
            <p className="text-base leading-8 text-muted-foreground md:text-lg">
              Practical essays, launch notes, and technical guides for creators
              building sustainable product businesses.
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
          <div className="flex min-h-80 flex-col items-center justify-center gap-5 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                No posts published yet
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                New articles will appear here after they are published from the
                admin CMS.
              </p>
            </div>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
              Back to Storefront
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
