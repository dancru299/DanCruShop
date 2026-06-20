import Link from "next/link";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <SearchIcon aria-hidden="true" className="size-7 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved. Check the URL or browse from the homepage.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/" />} nativeButton={false} size="sm">
            <ArrowLeftIcon aria-hidden="true" className="mr-1.5 size-4" />
            Back to homepage
          </Button>
          <Button render={<Link href="/products" />} nativeButton={false} variant="outline" size="sm">
            Browse products
          </Button>
          <Button render={<Link href="/blog" />} nativeButton={false} variant="ghost" size="sm">
            Read blog
          </Button>
        </div>
      </div>
    </main>
  );
}