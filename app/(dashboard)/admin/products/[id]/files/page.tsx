import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getProductFiles } from "@/actions/product-file.actions";
import { ProductFileManager } from "@/components/admin/product-file-manager";
import { buttonVariants } from "@/components/ui/button";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getAdminProductById } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

type ProductFilesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ProductFilesPage({
  params,
}: ProductFilesPageProps) {
  const { id } = await params;
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [product, files] = await Promise.all([
    getAdminProductById(id),
    getProductFiles(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Back to Product Edit
        </Link>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Product file delivery</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Quan ly file cho: {product.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload files to Supabase Storage and attach them to this product for
            secure downloads.
          </p>
        </div>
      </div>

      <ProductFileManager productId={product.id} initialFiles={files} />
    </div>
  );
}
