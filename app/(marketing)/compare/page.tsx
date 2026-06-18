import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, GitCompareIcon } from "lucide-react";

import { CompareMatrix } from "@/components/compare/compare-matrix";
import { buttonVariants } from "@/components/ui/button";
import { getCompareProducts } from "@/lib/supabase/queries/compare";

export const metadata: Metadata = {
  title: "So sánh sản phẩm",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ComparePageProps = {
  searchParams: Promise<{ items?: string }>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { items } = await searchParams;
  const slugs = (items ?? "")
    .split(",")
    .map((slug) => {
      try {
        return decodeURIComponent(slug).trim();
      } catch {
        return slug.trim();
      }
    })
    .filter(Boolean);

  const products = await getCompareProducts(slugs);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/products"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Tiếp tục xem sản phẩm
        </Link>
        <div className="flex items-center gap-3">
          <GitCompareIcon aria-hidden="true" className="size-6" />
          <h1 className="text-3xl font-semibold tracking-normal">
            So sánh kỹ thuật
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Đối chiếu stack công nghệ, tính năng tích hợp và chính sách bản quyền
          giữa các sản phẩm để chọn đúng starter kit cho dự án của bạn.
        </p>
      </div>

      {products.length >= 2 ? (
        <CompareMatrix products={products} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card/40 px-6 py-16 text-center">
          <GitCompareIcon
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <div className="grid gap-1">
            <p className="text-base font-medium">
              Cần ít nhất 2 sản phẩm để so sánh
            </p>
            <p className="text-sm text-muted-foreground">
              Bấm nút so sánh trên thẻ sản phẩm để thêm vào danh sách, rồi quay
              lại đây.
            </p>
          </div>
          <Link
            href="/products"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Khám phá sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
}
