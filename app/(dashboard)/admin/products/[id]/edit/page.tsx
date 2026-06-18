import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenIcon } from "lucide-react";

import { ProductForm } from "@/components/admin/product-form";
import { buttonVariants } from "@/components/ui/button";
import {
  getCategoryOptions,
  getProductCategoryIds,
} from "@/lib/supabase/queries/categories";
import { getAdminProductById } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

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

  const [categories, selectedCategoryIds] =
    await Promise.all([
      getCategoryOptions(),
      getProductCategoryIds(product.id),
    ]);

  return (
    <div className="flex flex-col gap-4">
      {product.product_type === "course" && (
        <div className="flex justify-end">
          <Link
            href={`/admin/products/${id}/course`}
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            <BookOpenIcon aria-hidden="true" data-icon="inline-start" />
            Manage Course Content
          </Link>
        </div>
      )}
      <ProductForm
        mode="edit"
        product={product}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
      />
    </div>
  );
}