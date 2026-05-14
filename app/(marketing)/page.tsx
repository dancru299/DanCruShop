import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, PackageOpenIcon } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { getPublishedProducts } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getPublishedProducts(6);

  return (
    <>
      <section className="border-b bg-background">
        <div className="mx-auto grid min-h-[34rem] w-full max-w-6xl items-center gap-10 px-4 py-14 md:min-h-[38rem] md:py-16 lg:min-h-[42rem] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex max-w-3xl flex-col gap-7">
            <div className="flex flex-col gap-5">
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-balance md:text-6xl">
                Practical digital products for builders who ship.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                DanCruShop brings together source code, templates, tools,
                learning notes, and future course resources in one clean
                storefront.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/products" />}
                nativeButton={false}
              >
                Browse Products
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/blog" />}
                nativeButton={false}
              >
                Read Blog
              </Button>
            </div>
          </div>

          <div className="relative hidden min-h-[28rem] lg:block">
            <div className="absolute inset-0 rounded-lg border bg-card shadow-sm" />
            <div className="absolute left-8 right-8 top-8 rounded-lg border bg-background p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Creator storefront</p>
                  <p className="text-sm text-muted-foreground">
                    Sell once, deliver instantly
                  </p>
                </div>
                <PackageOpenIcon className="text-muted-foreground" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8 right-8 rounded-lg border bg-background p-5 shadow-sm">
              <div className="grid gap-3">
                {["Source code", "Mini tools", "Course resources"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2"
                    >
                      <span className="text-sm">{item}</span>
                      <span className="text-xs text-muted-foreground">
                        Ready
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-2xl flex-col gap-3">
              <h2 className="text-2xl font-semibold tracking-normal md:text-3xl">
                Featured products
              </h2>
              <p className="text-sm leading-6 text-muted-foreground md:text-base">
                Fresh resources from the shop, curated for developers, learners,
                and makers building real projects.
              </p>
            </div>
            <Button
              variant="outline"
              render={<Link href="/products" />}
              nativeButton={false}
            >
              View all
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border bg-card p-8 text-center text-card-foreground">
              <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <BookOpenIcon aria-hidden="true" />
              </div>
              <div className="flex max-w-md flex-col gap-2">
                <h3 className="text-lg font-semibold tracking-normal">
                  No published products yet
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Once products are published in Supabase, the newest items will
                  appear here automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
