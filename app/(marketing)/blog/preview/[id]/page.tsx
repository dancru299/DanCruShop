/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeftIcon,
  EyeIcon,
} from "lucide-react";

import { BlogCoverArtwork } from "@/components/blog/blog-card";
import { buttonVariants } from "@/components/ui/button";
import { verifyPreviewToken } from "@/lib/blog/preview-token";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBlogPost } from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BlogPreviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return "";
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(
    new Date(value ?? fallback)
  );
}

async function getDraftPost(id: string): Promise<AdminBlogPost | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id,title,slug,excerpt,content,cover_image_url,status,author_id,seo_title,seo_description,published_at,created_at,updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load draft blog post for preview", error);
    return null;
  }

  return data as AdminBlogPost | null;
}

export default async function BlogPreviewPage({
  params,
  searchParams,
}: BlogPreviewPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token || !verifyPreviewToken(id, token)) {
    notFound();
  }

  const post = await getDraftPost(id);

  if (!post) {
    notFound();
  }

  const headings =
    post.content
      ?.split("\n")
      .map((line) => {
        const match = line.match(/^(#{2,3})\s+(.+)$/);
        if (!match) return null;
        const title = match[2].replace(/[#*_`]/g, "").trim();
        return { id: slugifyHeading(title), level: match[1].length, title };
      })
      .filter(Boolean)
      .slice(0, 7) ?? [];

  const headingIdMap = new Map(
    (headings as Array<{ id: string; title: string }>).map((h) => [h.title, h.id])
  );

  return (
    <div>
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2.5 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
        <div className="flex items-center gap-2 text-sm font-medium">
          <EyeIcon aria-hidden="true" className="size-4 shrink-0" />
          <span>
            Draft preview — status:{" "}
            <strong className="capitalize">{post.status}</strong>
          </span>
        </div>
        <Link
          href={`/admin/blog/${post.id}/edit`}
          className="text-xs font-medium underline underline-offset-4 hover:no-underline"
        >
          Edit post
        </Link>
      </div>

      <header className="border-b bg-card/25">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:py-14">
          <Link
            href="/admin/blog"
            className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
          >
            <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
            Back to blog admin
          </Link>

          <div className="flex flex-col gap-5">
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-balance md:text-5xl">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                {post.excerpt}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {formatDate(post.published_at, post.created_at)}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="relative aspect-[16/7] min-h-[15rem] overflow-hidden rounded-lg border bg-muted shadow-sm">
          {post.cover_image_url ? (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <BlogCoverArtwork post={{ ...post, published_at: post.published_at ?? null }} />
          )}
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-6xl items-start gap-10 px-4 pb-16 pt-2 md:pb-20 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]">
        <article className="min-w-0 rounded-lg border bg-card/60 p-5 shadow-sm md:p-8">
          <ReactMarkdown
            components={{
              h2: ({ children }) => {
                const title = getNodeText(children);
                const headingId = headingIdMap.get(title) ?? slugifyHeading(title);
                return (
                  <h2
                    id={headingId}
                    className="scroll-mt-24 border-t pt-8 text-2xl font-semibold leading-tight tracking-normal first:border-t-0 first:pt-0 md:text-3xl"
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => {
                const title = getNodeText(children);
                const headingId = headingIdMap.get(title) ?? slugifyHeading(title);
                return (
                  <h3
                    id={headingId}
                    className="scroll-mt-24 text-xl font-semibold leading-8 tracking-normal"
                  >
                    {children}
                  </h3>
                );
              },
              p: ({ children }) => (
                <p className="text-base leading-8 text-muted-foreground">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={href?.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="grid gap-3 pl-0 text-muted-foreground">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="grid list-decimal gap-3 pl-5 text-muted-foreground">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-7 marker:text-foreground">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="rounded-lg border-l-4 bg-muted/50 px-5 py-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
                  {children}
                </pre>
              ),
              code: ({ children }) => (
                <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm text-foreground">
                  {children}
                </code>
              ),
            }}
          >
            {post.content ?? ""}
          </ReactMarkdown>
        </article>

        {headings.length > 0 ? (
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-lg border bg-card/60 p-4 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold">In this post</h2>
              <nav className="grid gap-2">
                {(headings as Array<{ id: string; level: number; title: string }>).map(
                  (heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={cn(
                        "line-clamp-2 rounded-md px-2 py-1.5 text-sm leading-5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        heading.level === 3 && "ml-3 text-xs"
                      )}
                    >
                      {heading.title}
                    </a>
                  )
                )}
              </nav>
            </section>
          </aside>
        ) : null}
      </main>
    </div>
  );
}
