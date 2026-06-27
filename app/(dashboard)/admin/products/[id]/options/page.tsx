import { notFound } from "next/navigation";

import { ProductVariantsEditor } from "@/components/admin/product-variants-editor";
import { getProductVariants } from "@/lib/supabase/queries/product-variants";
import { getAdminProductById } from "@/lib/supabase/queries/products";

type OptionsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminProductVariantsPage({
  params,
}: OptionsPageProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  const variants = await getProductVariants(product.id);

  return (
    <ProductVariantsEditor
      productId={product.id}
      currency={product.currency}
      variants={variants}
    />
  );
}
