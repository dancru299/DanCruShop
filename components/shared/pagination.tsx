"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  total?: number;
  labelFormat?: string; // e.g., "products", "posts", "items"
  buildPageUrl?: (page: number) => string;
  onPageChange?: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  total,
  labelFormat = "items",
  buildPageUrl,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

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
      {total !== undefined && (
        <p className="text-xs text-muted-foreground">
          {total} {labelFormat} · Page {page} / {totalPages}
        </p>
      )}

      <nav
        aria-label="Pagination"
        className="flex items-center gap-1"
      >
        <PaginationItem
          buildPageUrl={buildPageUrl}
          onPageChange={onPageChange}
          page={page - 1}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </PaginationItem>

        {start > 1 && (
          <>
            <PaginationItem buildPageUrl={buildPageUrl} onPageChange={onPageChange} page={1}>
              1
            </PaginationItem>
            {start > 2 && (
              <span className="px-1 text-sm text-muted-foreground">…</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <PaginationItem
            key={p}
            buildPageUrl={buildPageUrl}
            onPageChange={onPageChange}
            page={p}
            active={p === page}
          >
            {p}
          </PaginationItem>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-sm text-muted-foreground">…</span>
            )}
            <PaginationItem buildPageUrl={buildPageUrl} onPageChange={onPageChange} page={totalPages}>
              {totalPages}
            </PaginationItem>
          </>
        )}

        <PaginationItem
          buildPageUrl={buildPageUrl}
          onPageChange={onPageChange}
          page={page + 1}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </PaginationItem>
      </nav>
    </div>
  );
}

function PaginationItem({
  page,
  disabled,
  active,
  children,
  buildPageUrl,
  onPageChange,
  "aria-label": ariaLabel,
}: {
  page: number;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  buildPageUrl?: (page: number) => string;
  onPageChange?: (page: number) => void;
  "aria-label"?: string;
}) {
  const className = cn(
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors cursor-pointer select-none",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground",
    disabled && "pointer-events-none opacity-40"
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    );
  }

  if (buildPageUrl) {
    return (
      <Link
        href={buildPageUrl(page)}
        aria-label={ariaLabel}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPageChange?.(page)}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {children}
    </button>
  );
}
