import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import {
  getCategoryOptions,
  getProductCategoryIds,
} from "@/lib/supabase/queries/categories";
import { getAdminProductById } from "@/lib/supabase/queries/products";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  // The layout redirects non-default options to their group's "option chính",
  // so this form always edits the shared content source.
  const [categories, selectedCategoryIds] = await Promise.all([
    getCategoryOptions(),
    getProductCategoryIds(product.id),
  ]);

  return (
    <ProductForm
      mode="edit"
      product={product}
      categories={categories}
      selectedCategoryIds={selectedCategoryIds}
    />
  );
}
