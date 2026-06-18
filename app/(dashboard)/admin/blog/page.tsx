import Link from "next/link";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { AdminMetric } from "@/components/admin/admin-metric";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BlogTable } from "@/components/admin/blog-table";
import { Button } from "@/components/ui/button";
import { getAdminBlogPosts } from "@/lib/supabase/queries/blog";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;
  const archivedCount = posts.filter((post) => post.status === "archived").length;
  const missingCoversCount = posts.filter((post) => !post.cover_image_url).length;

  const headerAction = (
    <Button render={<Link href="/admin/blog/new" />} nativeButton={false}>
      <PlusIcon aria-hidden="true" data-icon="inline-start" />
      Viết bài mới
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Quản lý nội dung"
        title="Blog"
        description="Lên kế hoạch, viết bản nháp, xem trước và xuất bản các bài viết chuẩn SEO cho DanCruShop."
        action={headerAction}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Tổng số bài viết" value={String(posts.length)} />
        <AdminMetric label="Đã xuất bản" value={String(publishedCount)} />
        <AdminMetric label="Bản nháp" value={String(draftCount)} />
        <AdminMetric label="Thiếu ảnh bìa" value={String(missingCoversCount)} />
      </div>

      <BlogTable posts={posts} />

      {archivedCount > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <ArchiveIcon aria-hidden="true" className="size-4" />
          Có {archivedCount} bài viết lưu trữ được ẩn khỏi trang danh sách công khai nhưng vẫn được lưu lại trong lịch sử biên tập.
        </div>
      ) : null}
    </div>
  );
}
