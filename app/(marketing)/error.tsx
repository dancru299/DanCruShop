"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcwIcon, StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public storefront error:", {
      digest: error.digest,
      message: error.message,
      name: error.name,
    });
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <StoreIcon aria-hidden="true" className="size-7 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            We couldn&rsquo;t load this page right now. The shop is still open &mdash;
            please try again or browse from the homepage.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} size="sm">
            <RotateCcwIcon aria-hidden="true" className="mr-1.5 size-4" />
            Try again
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/products">Browse products</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Homepage</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}