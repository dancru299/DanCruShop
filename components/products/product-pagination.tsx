"use client";

import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/shared/pagination";

type ProductPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
};

export function ProductPagination({
  page,
  totalPages,
  total,
}: ProductPaginationProps) {
  const searchParams = useSearchParams();

  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }

    return `/products?${params.toString()}`;
  }

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      total={total}
      labelFormat="products"
      buildPageUrl={buildPageUrl}
    />
  );
}

