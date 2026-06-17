import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions } from "@/lib/supabase/queries/categories";
import { getTechIconOptions } from "@/lib/supabase/queries/tech-icons";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, techIcons] = await Promise.all([
    getCategoryOptions(),
    getTechIconOptions(),
  ]);

  return (
    <ProductForm mode="create" categories={categories} techIcons={techIcons} />
  );
}
