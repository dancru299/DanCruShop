import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartIcon } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import {
  getSupabaseErrorDetails,
  isMissingProductFavoritesTable,
} from "@/lib/supabase/errors";
import type { PublishedProduct } from "@/lib/supabase/queries/products";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yêu thích",
  description: "Các sản phẩm bạn đã lưu trong DanCruShop.",
};

type FavoriteProductRow = {
  product: PublishedProduct | PublishedProduct[] | null;
};

async function getFavoriteProducts(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_favorites")
    .select(
      `
        product:products!inner (
          id,
          title,
          slug,
          short_description,
          price_cents,
          currency,
          thumbnail_url,
          product_type,
          is_free
        )
      `
    )
    .eq("user_id", userId)
    .eq("products.status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    const errorDetails = getSupabaseErrorDetails(error);

    console.warn(
      isMissingProductFavoritesTable(error)
        ? "Favorite products table is not deployed."
        : "Failed to fetch favorite products.",
      errorDetails
    );

    return [];
  }

  return ((data ?? []) as FavoriteProductRow[]).flatMap((row) => {
    const product = Array.isArray(row.product) ? row.product[0] : row.product;

    return product ? [product] : [];
  });
}

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/favorites")}`);
  }

  const products = await getFavoriteProducts(user.id);

  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 md:py-14">
          <p className="text-sm font-medium text-muted-foreground">
            DanCruShop
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
            Sản phẩm yêu thích
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Những sản phẩm bạn đã lưu để xem lại, so sánh hoặc mua sau.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border bg-card p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <HeartIcon aria-hidden="true" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Chưa có sản phẩm yêu thích
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Bấm biểu tượng trái tim trên sản phẩm để lưu lại tại đây.
              </p>
            </div>
            <Button
              render={<Link href="/products" />}
              nativeButton={false}
              variant="outline"
            >
              Khám phá sản phẩm
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
