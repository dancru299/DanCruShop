import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { fulfillPayPalOrderByPayPalId } from "@/lib/payments/paypal-webhook";
import { getSupportMailto } from "@/lib/site-config";

export const dynamic = "force-dynamic";

type PayPalReturnPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function PayPalReturnPage({
  searchParams,
}: PayPalReturnPageProps) {
  const { token } = await searchParams;
  let fulfilled = false;

  if (token) {
    try {
      const { status } = await capturePayPalOrder(token);

      if (status === "COMPLETED") {
        await fulfillPayPalOrderByPayPalId(token);
        fulfilled = true;
      }
    } catch (error) {
      console.error("Failed to confirm PayPal payment on return", error);
    }
  }

  if (fulfilled) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-500">
            <AlertCircleIcon aria-hidden="true" className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-normal">
            We couldn&apos;t confirm your payment
          </h1>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            If you completed the payment, it can take a moment to settle — your
            products will appear in your dashboard automatically. If you were not
            charged, you can try the purchase again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              Go to dashboard
            </Button>
            <Button
              variant="outline"
              render={<Link href="/products" />}
              nativeButton={false}
            >
              <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
              Back to store
            </Button>
          </div>
          <Link
            href={getSupportMailto("PayPal payment issue")}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Contact support
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
