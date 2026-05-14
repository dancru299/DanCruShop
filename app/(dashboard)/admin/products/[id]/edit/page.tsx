import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
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

  return <ProductForm mode="edit" product={product} />;
}
