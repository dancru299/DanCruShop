"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboardIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard section error:", {
      digest: error.digest,
      message: error.message,
      name: error.name,
    });
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <LayoutDashboardIcon
            aria-hidden="true"
            className="size-7 text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard unavailable
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            We couldn&rsquo;t load your dashboard right now. Your purchased
            products and settings are safe — please try again in a moment.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} size="sm">
            <RotateCcwIcon aria-hidden="true" className="mr-1.5 size-4" />
            Try again
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Back to homepage</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}