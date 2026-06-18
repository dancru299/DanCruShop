import Link from "next/link";
import { ArrowLeftIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react";

import { DanCruShopLogo, DanCruShopMark } from "@/components/shared/dancrushop-logo";

const highlights = [
  {
    icon: ZapIcon,
    title: "Instant digital delivery",
    description: "Once payment clears, get your download link and license right in your account.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure & private",
    description: "Sign in safely with a 6-digit verification code or Google login.",
  },
  {
    icon: SparklesIcon,
    title: "Lifetime updates",
    description: "Buy once and receive every new update for the products you own.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,white,transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-size-[32px_32px]"
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 ring-1 ring-inset ring-primary-foreground/25">
              <DanCruShopMark className="size-6" />
            </span>
            <span className="text-base font-semibold tracking-normal">
              DanCruShop
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-normal">
            The digital product store for developers.
          </h2>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
            Quality source code, templates, and tools — buy fast, get them
            instantly, use them for life.
          </p>

          <ul className="mt-10 flex flex-col gap-6">
            {highlights.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 ring-1 ring-inset ring-primary-foreground/25">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm leading-6 text-primary-foreground/75">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} DanCruShop. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex min-h-dvh flex-col bg-background px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" aria-label="DanCruShop">
            <DanCruShopLogo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
            Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <section className="w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
            {children}
          </section>
        </div>

        <div className="hidden justify-center lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
            Back to store
          </Link>
        </div>
      </div>
    </main>
  );
}
