import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { BundleItemsManager } from "@/components/admin/bundle-items-manager";
import { buttonVariants } from "@/components/ui/button";
import {
  getBundleCandidateProducts,
  getBundleChildIds,
} from "@/lib/supabase/queries/bundles";
import { getAdminProductById } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

type BundlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminBundlePage({ params }: BundlePageProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  const [candidates, initialChildIds] = await Promise.all([
    getBundleCandidateProducts(product.id),
    getBundleChildIds(product.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/products/${product.id}/edit`}
        className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
      >
        <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
        Quay lại sản phẩm
      </Link>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Bundle</p>
        <h1 className="text-3xl font-semibold tracking-normal">
          {product.title}
        </h1>
        {product.product_type !== "bundle" ? (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-6 text-amber-700 dark:text-amber-200">
            Sản phẩm này không phải loại “Bundle”. Đổi product type sang Bundle để
            thành phần được mở khoá khi mua.
          </p>
        ) : null}
      </div>

      <BundleItemsManager
        bundleId={product.id}
        candidates={candidates}
        initialChildIds={initialChildIds}
      />
    </div>
  );
}
