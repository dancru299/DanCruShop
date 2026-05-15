/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeftIcon } from "lucide-react";

import { BlogCoverArtwork } from "@/components/blog/blog-card";
import { buttonVariants } from "@/components/ui/button";
import { getPostBySlug } from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(value ?? fallback));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  const title = post.seo_title ?? post.title;
  const description =
    post.seo_description ??
    post.excerpt ??
    "Read this article on the DanCruShop blog.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div>
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 md:py-14">
            <Link
              href="/blog"
              className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              Back to Blog
            </Link>

            <div className="flex flex-col gap-5">
              <p className="text-sm font-medium uppercase tracking-normal text-muted-foreground">
                {formatDate(post.published_at, post.created_at)} · DanCruShop
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance md:text-6xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="text-base leading-8 text-muted-foreground md:text-lg">
                  {post.excerpt}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="relative aspect-[16/8] overflow-hidden rounded-lg border bg-muted shadow-sm">
            {post.cover_image_url ? (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <BlogCoverArtwork post={post} />
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 md:pb-20">
          <article className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown>{post.content ?? ""}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
