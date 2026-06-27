import { notFound } from "next/navigation";

import { BundleItemsManager } from "@/components/admin/bundle-items-manager";
import {
  getBundleCandidateProducts,
  getBundleChildIds,
} from "@/lib/supabase/queries/bundles";
import { getAdminProductById } from "@/lib/supabase/queries/products";

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
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold tracking-normal">
          Bộ sản phẩm
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Chọn các sản phẩm con sẽ được mở khoá khi khách mua bộ này.
        </p>
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
