import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSupportEmail, getSupportMailto } from "@/lib/site-config";

type PolicyPoint = {
  description: string;
  Icon: LucideIcon;
  title: string;
};

export function PolicyPageShell({
  description,
  points,
  title,
}: {
  description: string;
  points: PolicyPoint[];
  title: string;
}) {
  const supportEmail = getSupportEmail();

  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 md:py-14">
          <p className="text-sm font-medium text-muted-foreground">
            DanCruShop beta
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-8 md:grid-cols-3 md:py-10">
        {points.map((point) => (
          <div
            key={point.title}
            className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted text-foreground">
              <point.Icon aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-normal">
              {point.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {point.description}
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-base font-semibold tracking-normal">
              Need us to check a specific case?
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Email support replies within 24 hours during beta.
            </p>
          </div>
          <Button
            render={<Link href={getSupportMailto("DanCruShop policy support")} />}
            nativeButton={false}
          >
            {supportEmail}
          </Button>
        </div>
      </section>
    </div>
  );
}
