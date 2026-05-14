import { notFound } from "next/navigation";

import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getAdminBlogPostById } from "@/lib/supabase/queries/blog";

type EditBlogPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  const { id } = await params;
  const post = await getAdminBlogPostById(id);

  if (!post) {
    notFound();
  }

  return <BlogPostForm mode="edit" post={post} />;
}
