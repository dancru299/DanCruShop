import { CategoryForm } from "@/components/admin/category-form";

export const dynamic = "force-dynamic";

export default function NewCategoryPage() {
  return <CategoryForm mode="create" />;
}
