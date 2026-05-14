import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Content management</p>
          <h1 className="text-3xl font-semibold tracking-normal">Blog</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Write, edit, and publish SEO content for DanCruShop.
          </p>
        </div>

        <Link
          href="/admin/blog/new"
          className={cn(buttonVariants(), "w-fit")}
        >
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          Viet bai moi
        </Link>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {posts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{post.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        /blog/{post.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(post.status)}>
                      {statusLabels[post.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.published_at)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" })
                      )}
                    >
                      <PencilIcon aria-hidden="true" data-icon="inline-start" />
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                No blog posts yet
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Create the first article for content marketing and SEO.
              </p>
            </div>
            <Link
              href="/admin/blog/new"
              className={cn(buttonVariants(), "w-fit")}
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              Viet bai moi
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
