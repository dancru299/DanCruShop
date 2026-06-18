"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileTextIcon, ImageIcon, PlusIcon } from "lucide-react";

import {
  AdminActionMenu,
  AdminActionMenuLink,
} from "@/components/admin/admin-action-menu";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminBlogPostListItem } from "@/lib/supabase/queries/blog";

type BlogTableProps = {
  posts: AdminBlogPostListItem[];
};

const statusLabels: Record<AdminBlogPostListItem["status"], string> = {
  archived: "Đã lưu trữ",
  draft: "Bản nháp",
  published: "Đã xuất bản",
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
    return "Chưa xuất bản";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function BlogCover({ post }: { post: AdminBlogPostListItem }) {
  return (
    <div className="relative size-14 overflow-hidden rounded-lg border bg-muted shrink-0">
      {post.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
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

export function BlogTable({ posts }: BlogTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return posts;
    }

    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.slug.toLowerCase().includes(term) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(term))
    );
  }, [posts, query]);

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm kiếm bài viết theo tiêu đề hoặc slug..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Không gian soạn thảo
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Hiển thị {filtered.length}/{posts.length} bài viết.
          </p>
        </div>

        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[48%]">Bài viết</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày xuất bản</TableHead>
                <TableHead>Cập nhật lần cuối</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((post) => (
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
                            <Badge variant="secondary">Cần ảnh bìa</Badge>
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
                    <AdminActionMenu label={`Hành động cho bài viết ${post.title}`}>
                      <AdminActionMenuLink
                        href={`/blog/${post.slug}`}
                        icon="external-link"
                      >
                        Xem bài viết
                      </AdminActionMenuLink>
                      <AdminActionMenuLink
                        href={`/admin/blog/${post.id}/edit`}
                        icon="pencil"
                      >
                        Chỉnh sửa
                      </AdminActionMenuLink>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={FileTextIcon}
              title={
                posts.length === 0
                  ? "Chưa có bài viết nào"
                  : "Không tìm thấy bài viết"
              }
              description={
                posts.length === 0
                  ? "Hãy viết bài viết đầu tiên, đăng tải ảnh bìa và xuất bản bài viết lên blog."
                  : "Vui lòng thử tìm kiếm bằng từ khóa khác."
              }
              action={
                posts.length === 0 ? (
                  <Button render={<Link href="/admin/blog/new" />} nativeButton={false}>
                    <PlusIcon aria-hidden="true" data-icon="inline-start" />
                    Viết bài mới
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
