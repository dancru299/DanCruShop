import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions } from "@/lib/supabase/queries/categories";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategoryOptions();

  return <ProductForm mode="create" categories={categories} />;
}
