import Link from "next/link";
import {
  ArrowLeftIcon,
  GaugeIcon,
  LifeBuoyIcon,
  MailCheckIcon,
} from "lucide-react";

import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { betaPolicies, getSupportEmail, getSupportMailto } from "@/lib/site-config";

export default function CheckoutSuccessPage() {
  const supportEmail = getSupportEmail();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ClearCartOnMount />
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <MailCheckIcon aria-hidden="true" className="size-7" />
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-normal">
              Payment successful!
            </h1>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Please check your email for the Magic Link to access your
              products. Once you open the link, your purchases will appear in
              the dashboard.
            </p>
          </div>

          <div className="grid w-full gap-3 text-left sm:grid-cols-3">
            <div className="rounded-lg border bg-background/50 p-3">
              <MailCheckIcon aria-hidden="true" className="mb-2 size-4" />
              <p className="text-sm font-medium">1. Check your email</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                The magic link may take a few minutes during beta.
              </p>
            </div>
            <div className="rounded-lg border bg-background/50 p-3">
              <GaugeIcon aria-hidden="true" className="mb-2 size-4" />
              <p className="text-sm font-medium">2. Open the dashboard</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your purchased resources live in the dashboard area.
              </p>
            </div>
            <div className="rounded-lg border bg-background/50 p-3">
              <LifeBuoyIcon aria-hidden="true" className="mb-2 size-4" />
              <p className="text-sm font-medium">3. Need help?</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {betaPolicies.support}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              render={<Link href="/products" />}
              nativeButton={false}
            >
              <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
              Browse more products
            </Button>
            <Button render={<Link href="/login" />} nativeButton={false}>
              Open login page
            </Button>
            <Button
              variant="secondary"
              render={<Link href={getSupportMailto("Checkout support")} />}
              nativeButton={false}
            >
              {supportEmail}
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
