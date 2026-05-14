import { PackageOpenIcon } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { getPublishedProducts } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div className="bg-background">
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 md:py-14">
          <p className="text-sm font-medium text-muted-foreground">
            DanCruShop
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
            Tất cả sản phẩm
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Khám phá toàn bộ source code, template, công cụ và tài nguyên số
            đang được phát hành.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <PackageOpenIcon aria-hidden="true" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Chưa có sản phẩm
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Khi có sản phẩm được publish, danh sách sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
