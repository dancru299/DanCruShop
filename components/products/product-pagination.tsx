"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

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

  if (totalPages <= 1) return null;

  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }

    return `/products?${params.toString()}`;
  }

  // Show at most 5 page numbers centered around current page
  const pages: number[] = [];
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted-foreground">
        {total} products · Page {page} / {totalPages}
      </p>

      <nav
        aria-label="Pagination"
        className="flex items-center gap-1"
      >
        <PaginationLink
          href={buildPageUrl(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </PaginationLink>

        {start > 1 && (
          <>
            <PaginationLink href={buildPageUrl(1)}>1</PaginationLink>
            {start > 2 && (
              <span className="px-1 text-sm text-muted-foreground">…</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <PaginationLink
            key={p}
            href={buildPageUrl(p)}
            active={p === page}
          >
            {p}
          </PaginationLink>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-sm text-muted-foreground">…</span>
            )}
            <PaginationLink href={buildPageUrl(totalPages)}>
              {totalPages}
            </PaginationLink>
          </>
        )}

        <PaginationLink
          href={buildPageUrl(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </PaginationLink>
      </nav>
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  active,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Link
      href={disabled ? "#" : href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground",
        disabled && "pointer-events-none opacity-40"
      )}
      tabIndex={disabled ? -1 : undefined}
    >
      {children}
    </Link>
  );
}
