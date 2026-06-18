"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, ArrowLeftIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled runtime error:", {
      digest: error.digest,
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
    });

    // Keep this ready for Sentry or other error reporting
    // Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center px-4">
          <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
              <AlertTriangleIcon
                aria-hidden="true"
                className="size-7 text-destructive"
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Something went wrong
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                An unexpected error occurred. This may be temporary &mdash; please
                try again in a moment.
              </p>
              {error.digest ? (
                <p className="font-mono text-xs text-muted-foreground">
                  Ref: {error.digest}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={reset} size="sm">
                <RotateCcwIcon aria-hidden="true" className="mr-1.5 size-4" />
                Try again
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/">
                  <ArrowLeftIcon aria-hidden="true" className="mr-1.5 size-4" />
                  Back to homepage
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}