"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon, RotateCcwIcon, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop section error:", {
      digest: error.digest,
      message: error.message,
      name: error.name,
    });
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <ShoppingCartIcon
            aria-hidden="true"
            className="size-7 text-destructive"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Checkout error
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            An error occurred during checkout. Your payment has not been
            processed &mdash; please try again.
          </p>
          <div className="rounded-lg border bg-muted/50 p-3 text-left text-xs leading-5 text-muted-foreground">
            <p className="font-medium text-foreground">No charge was made.</p>
            <p className="mt-1">
              If this keeps happening, contact{" "}
              <a
                href="mailto:support@dancrushop.com"
                className="underline underline-offset-2 hover:text-foreground"
              >
                support@dancrushop.com
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} size="sm">
            <RotateCcwIcon aria-hidden="true" className="mr-1.5 size-4" />
            Try again
          </Button>
          <Button render={<Link href="/cart" />} nativeButton={false} variant="outline" size="sm">
            <ArrowLeftIcon aria-hidden="true" className="mr-1.5 size-4" />
            Back to cart
          </Button>
        </div>
      </div>
    </main>
  );
}