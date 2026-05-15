/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArchiveIcon,
  FileTextIcon,
  ImageIcon,
  PlusIcon,
} from "lucide-react";

import {
  AdminActionMenu,
  AdminActionMenuLink,
} from "@/components/admin/admin-action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminBlogPosts,
  type AdminBlogPostListItem,
} from "@/lib/supabase/queries/blog";

export const dynamic = "force-dynamic";

const statusLabels: Record<AdminBlogPostListItem["status"], string> = {
  archived: "Archived",
  draft: "Draft",
  published: "Published",
};

function getStatusBadgeVariant(status: AdminBlogPostListItem["status"]) {
  if (status === "published") {
    return "default" as const;
  }

  if (status === "archived") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function BlogMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function BlogCover({ post }: { post: AdminBlogPostListItem }) {
  return (
    <div className="relative size-14 overflow-hidden rounded-lg border bg-muted">
      {post.cover_image_url ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          src={post.cover_image_url}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ImageIcon aria-hidden="true" className="size-4" />
        </div>
      )}
    </div>
  );
}

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;
  const archivedCount = posts.filter((post) => post.status === "archived").length;
  const missingCoversCount = posts.filter((post) => !post.cover_image_url).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Content management</p>
          <h1 className="text-3xl font-semibold tracking-normal">Blog</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Plan, draft, preview, and publish SEO content for DanCruShop.
          </p>
        </div>

        <Button render={<Link href="/admin/blog/new" />} nativeButton={false}>
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          New Post
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BlogMetric label="Total posts" value={String(posts.length)} />
        <BlogMetric label="Published" value={String(publishedCount)} />
        <BlogMetric label="Drafts" value={String(draftCount)} />
        <BlogMetric label="Missing covers" value={String(missingCoversCount)} />
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Editorial workspace
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Each post shows cover readiness, publish status, and public URL.
          </p>
        </div>

        {posts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[48%]">Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <BlogCover post={post} />
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate font-medium">
                            {post.title}
                          </span>
                          {!post.cover_image_url ? (
                            <Badge variant="secondary">Needs cover</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {post.excerpt ?? `/blog/${post.slug}`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(post.status)}>
                      {statusLabels[post.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.published_at)}</TableCell>
                  <TableCell>{formatDate(post.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu label={`Actions for ${post.title}`}>
                      <AdminActionMenuLink
                        href={`/blog/${post.slug}`}
                        icon="external-link"
                      >
                        View
                      </AdminActionMenuLink>
                      <AdminActionMenuLink
                        href={`/admin/blog/${post.id}/edit`}
                        icon="pencil"
                      >
                        Edit
                      </AdminActionMenuLink>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <FileTextIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                No blog posts yet
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Create the first article, upload a cover, and preview the card
                before publishing.
              </p>
            </div>
            <Button render={<Link href="/admin/blog/new" />} nativeButton={false}>
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              New Post
            </Button>
          </div>
        )}
      </div>

      {archivedCount > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <ArchiveIcon aria-hidden="true" className="size-4" />
          {archivedCount} archived post{archivedCount === 1 ? "" : "s"} are
          hidden from public listing but kept for editorial history.
        </div>
      ) : null}
    </div>
  );
}
