import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpenIcon } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { getPublishedProducts } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description: "Khám phá toàn bộ tool, source code và tài nguyên số trên DanCruShop.",
};

const upcomingProducts = [
  {
    title: "Starter full-stack",
    type: "Source code",
    description: "Bộ code mẫu có auth, database, dashboard và payment flow.",
    className: "from-emerald-500/25 via-cyan-500/10 to-background",
  },
  {
    title: "Ghi chú workflow AI",
    type: "Tài liệu học",
    description: "Ghi chú triển khai AI app, agent workflow và cách đóng gói sản phẩm.",
    className: "from-cyan-500/25 via-amber-500/10 to-background",
  },
  {
    title: "Mini tool cho builder",
    type: "Mini tool",
    description: "Công cụ nhỏ phục vụ automation, productivity và vận hành shop.",
    className: "from-rose-500/20 via-emerald-500/10 to-background",
  },
];

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 md:py-14">
          <p className="text-sm font-medium text-muted-foreground">
            DanCruShop
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
            Kho sản phẩm
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Quét nhanh toàn bộ source code, template, tool và tài nguyên số
            đang mở bán.
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
          <div className="grid gap-6">
            <div className="flex flex-col gap-4 rounded-lg border bg-card/60 backdrop-blur-xl p-6 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex max-w-2xl gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <PackageOpenIcon aria-hidden="true" />
                </div>
                <div className="grid gap-2">
                  <h2 className="text-xl font-semibold tracking-normal">
                    Sản phẩm đang được chuẩn bị
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Khi có sản phẩm được publish, danh sách thật sẽ xuất hiện ở
                    đây. Trong lúc chờ dữ liệu live, đây là các nhóm tài nguyên
                    storefront đang được tối ưu để phục vụ.
                  </p>
                </div>
              </div>
              <Button
                className="w-fit"
                variant="outline"
                render={<Link href="/blog" />}
                nativeButton={false}
              >
                Xem bài viết
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {upcomingProducts.map((item) => (
                <div
                  key={item.title}
                  className="flex min-h-72 flex-col overflow-hidden rounded-lg border bg-card/60 backdrop-blur-xl text-card-foreground shadow-sm"
                >
                  <div
                    className={`relative aspect-[16/10] bg-gradient-to-br ${item.className}`}
                  >
                    <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        {item.type}
                      </span>
                      <PackageOpenIcon
                        aria-hidden="true"
                        className="size-5 text-foreground/60"
                      />
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 grid gap-2">
                      <div className="h-2 w-24 rounded-full bg-foreground/70" />
                      <div className="h-2 w-36 rounded-full bg-foreground/25" />
                      <div className="h-2 w-20 rounded-full bg-foreground/20" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <h3 className="text-base font-semibold leading-6 tracking-normal">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-auto border-t pt-4 text-sm font-medium text-muted-foreground">
                      Đang chuẩn bị publish
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
