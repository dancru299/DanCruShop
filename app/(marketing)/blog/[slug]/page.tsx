/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  Clock3Icon,
  HashIcon,
  Layers3Icon,
  SparklesIcon,
} from "lucide-react";

import { BlogCoverArtwork } from "@/components/blog/blog-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getPostBySlug,
  getPublishedPosts,
  type BlogPostDetail,
  type PublishedBlogPost,
} from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
  }).format(new Date(value ?? fallback));
}

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }

  return "";
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getReadingTime(content: string | null) {
  const words = stripMarkdown(content ?? "").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.ceil(words / 220));

  return `${minutes} phút đọc`;
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractHeadings(content: string | null) {
  const usedIds = new Map<string, number>();
  const headings =
    content
      ?.split("\n")
      .map((line) => {
        const match = line.match(/^(#{2,3})\s+(.+)$/);

        if (!match) {
          return null;
        }

        const title = stripMarkdown(match[2]);
        const baseId = slugifyHeading(title) || "section";
        const count = usedIds.get(baseId) ?? 0;
        usedIds.set(baseId, count + 1);

        return {
          id: count ? `${baseId}-${count + 1}` : baseId,
          level: match[1].length,
          title,
        };
      })
      .filter(Boolean) ?? [];

  return headings.slice(0, 7) as Array<{
    id: string;
    level: number;
    title: string;
  }>;
}

function getPostSummary(post: PublishedBlogPost) {
  return (
    post.excerpt ??
    "Ghi chú thực chiến cho builder đang xây và bán sản phẩm số."
  );
}

function getArticleTopics(post: BlogPostDetail) {
  const source = `${post.title} ${post.excerpt ?? ""} ${post.content ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const topicRules = [
    { label: "Sản phẩm số", keywords: ["product", "san pham", "template"] },
    { label: "Thương mại creator", keywords: ["creator", "shop", "storefront"] },
    { label: "Thanh toán", keywords: ["checkout", "payment", "thanh toan"] },
    { label: "Nội dung", keywords: ["blog", "content", "bai viet"] },
    { label: "Vận hành", keywords: ["admin", "dashboard", "workflow"] },
    { label: "Ra mắt", keywords: ["launch", "ship", "release"] },
    { label: "Tự động hóa", keywords: ["automation", "tool", "system"] },
    { label: "Học tập", keywords: ["course", "learning", "khoa hoc"] },
  ];
  const topics = topicRules
    .filter((topic) => topic.keywords.some((keyword) => source.includes(keyword)))
    .map((topic) => topic.label);

  return topics.length >= 3
    ? topics.slice(0, 5)
    : ["Sản phẩm số", "Thương mại creator", "Ghi chú DanCruShop"];
}

function getHeadingIdMap(headings: ReturnType<typeof extractHeadings>) {
  const map = new Map<string, string>();

  for (const heading of headings) {
    if (!map.has(heading.title)) {
      map.set(heading.title, heading.id);
    }
  }

  return map;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    };
  }

  const title = post.seo_title ?? post.title;
  const description =
    post.seo_description ??
    post.excerpt ??
    "Đọc bài viết này trên DanCruShop.";

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
  const [post, publishedPosts] = await Promise.all([
    getPostBySlug(slug),
    getPublishedPosts(6),
  ]);

  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const headingIdMap = getHeadingIdMap(headings);
  const relatedPosts = publishedPosts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);
  const topics = getArticleTopics(post);
  const readingTime = getReadingTime(post.content);

  return (
    <div>
      <header className="border-b bg-card/25">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:py-14">
          <Link
            href="/blog"
            className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
          >
            <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
            Quay lại Bài viết
          </Link>

          <div className="grid gap-7 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)] lg:items-end">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="h-6 gap-1.5 rounded-lg">
                  <BookOpenIcon aria-hidden="true" data-icon="inline-start" />
                  Bài viết DanCruShop
                </Badge>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-lg border bg-background px-2 text-xs font-medium text-muted-foreground">
                  <Clock3Icon aria-hidden="true" className="size-3.5" />
                  {readingTime}
                </span>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-lg border bg-background px-2 text-xs font-medium text-muted-foreground">
                  <CalendarDaysIcon aria-hidden="true" className="size-3.5" />
                  {formatDate(post.published_at, post.created_at)}
                </span>
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-balance md:text-6xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  {post.excerpt}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <SparklesIcon aria-hidden="true" className="size-5" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-semibold">Góc nhìn builder</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Ghi chú, chiến thuật và tư duy sản phẩm để xây một storefront sắc nét hơn.
                  </p>
                </div>
              </div>
            </div>
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
            <BlogCoverArtwork post={post} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-6xl items-start gap-10 px-4 pb-16 pt-2 md:pb-20 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]">
        <article className="min-w-0 rounded-lg border bg-card/60 backdrop-blur-xl p-5 shadow-sm md:p-8">
          <ReactMarkdown
            components={{
              h2: ({ children }) => {
                const title = getNodeText(children);
                const id = headingIdMap.get(title) ?? slugifyHeading(title);

                return (
                  <h2
                    id={id}
                    className="scroll-mt-24 border-t pt-8 text-2xl font-semibold leading-tight tracking-normal first:border-t-0 first:pt-0 md:text-3xl"
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => {
                const title = getNodeText(children);
                const id = headingIdMap.get(title) ?? slugifyHeading(title);

                return (
                  <h3
                    id={id}
                    className="scroll-mt-24 text-xl font-semibold leading-8 tracking-normal"
                  >
                    {children}
                  </h3>
                );
              },
              p: ({ children }) => (
                <p className="text-base leading-8 text-muted-foreground">
                  {children}
                </p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href?.startsWith("http")
                      ? "noreferrer noopener"
                      : undefined
                  }
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="grid gap-3 pl-0 text-muted-foreground">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="grid list-decimal gap-3 pl-5 text-muted-foreground">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-7 marker:text-foreground">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="rounded-lg border-l-4 bg-muted/50 px-5 py-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src ?? ""}
                  alt={alt ?? ""}
                  className="my-8 aspect-[16/9] w-full rounded-lg border object-cover"
                />
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

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          {headings.length > 0 ? (
            <section className="rounded-lg border bg-card/60 backdrop-blur-xl p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <HashIcon aria-hidden="true" className="size-4" />
                <h2 className="text-sm font-semibold">Trong bài viết</h2>
              </div>
              <nav className="grid gap-2">
                {headings.map((heading) => (
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
                ))}
              </nav>
            </section>
          ) : null}

          <section className="rounded-lg border bg-card/60 backdrop-blur-xl p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Layers3Icon aria-hidden="true" className="size-4" />
              <h2 className="text-sm font-semibold">Đọc tiếp</h2>
            </div>
            {relatedPosts.length > 0 ? (
              <div className="grid gap-3">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="group/related grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 rounded-lg border bg-background p-2 transition-[border-color,background-color] hover:border-foreground/35 hover:bg-muted/40"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                      {item.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.title}
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/related:scale-105"
                        />
                      ) : (
                        <BlogCoverArtwork post={item} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium leading-5">
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {getPostSummary(item)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Bài viết liên quan sẽ xuất hiện ở đây khi blog có thêm nội dung.
              </p>
            )}
          </section>

          <section className="rounded-lg border bg-card/60 backdrop-blur-xl p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BookOpenIcon aria-hidden="true" className="size-4" />
              <h2 className="text-sm font-semibold">Chủ đề</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Badge
                  key={topic}
                  variant="outline"
                  className="h-6 rounded-lg bg-background"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-foreground p-4 text-background shadow-sm">
            <p className="text-sm font-semibold">Xây cùng DanCruShop</p>
            <p className="mt-2 text-sm leading-6 text-background/75">
              Biến ý tưởng từ blog thành source code, template và tool có thể ship ngay.
            </p>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mt-4 w-full bg-background text-foreground hover:bg-background/90"
              )}
            >
              Xem sản phẩm
              <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
          </section>
        </aside>
      </main>
    </div>
  );
}
