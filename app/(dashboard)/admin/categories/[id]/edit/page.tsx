import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import { getCategoryById } from "@/lib/supabase/queries/categories";

type EditCategoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  return <CategoryForm mode="edit" category={category} />;
}
