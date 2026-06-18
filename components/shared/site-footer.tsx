/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRightIcon, GiftIcon, ShieldCheckIcon } from "lucide-react";

import { DanCruShopLogo } from "@/components/shared/dancrushop-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  getSupportEmail,
  getSupportMailto,
  policyLinks,
} from "@/lib/site-config";
import { getStoreSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const productLinks = [
  { label: "All products", href: "/products" },
  { label: "Categories", href: "/#categories" },
  { label: "Blog", href: "/blog" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-normal">{title}</h3>
      <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <Link
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const supportEmail = getSupportEmail();
  const { socials } = await getStoreSettings();

  return (
    <footer className="border-t border-border/80 bg-muted/30">
      {/* CTA band */}
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-10 text-center text-primary-foreground shadow-lg md:px-12 md:py-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-primary-foreground/90 md:text-base">
            Join our community of happy customers and explore a diverse library
            of digital products today.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-transparent bg-white text-primary shadow-sm hover:bg-white/90 hover:text-primary"
              )}
            >
              Explore now
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              View deals
              <GiftIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="border-t border-border/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <DanCruShopLogo />
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              A trusted marketplace for tools, source code, and digital
              resources — delivered instantly after payment.
            </p>
            {socials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {socials.map((social, index) => (
                  <Link
                    key={`${social.url}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/40"
                  >
                    <img
                      src={social.iconUrl}
                      alt={social.label}
                      className="size-5 object-contain"
                    />
                  </Link>
                ))}
              </div>
            ) : null}
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheckIcon
                aria-hidden="true"
                className="size-3.5 text-emerald-500"
              />
              Secure transactions
            </span>
          </div>

          <FooterColumn title="Products" links={productLinks} />

          <FooterColumn
            title="Information"
            links={[
              {
                label: "Contact support",
                href: getSupportMailto("DanCruShop support"),
              },
              ...policyLinks,
            ]}
          />

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-normal">Community</h3>
            {socials.length > 0 ? (
              <>
                <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                  {socials.map((social, index) => (
                    <li key={`${social.url}-${index}`}>
                      <Link
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 transition-colors hover:text-foreground"
                      >
                        <img
                          src={social.iconUrl}
                          alt=""
                          className="size-4 shrink-0 object-contain"
                        />
                        {social.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="text-xs leading-5 text-muted-foreground">
                  New products are announced here — join so you never miss one.
                </p>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Add community channels (Telegram, Facebook...) in{" "}
                <Link href="/admin/settings" className="hover:text-foreground">
                  /admin/settings
                </Link>
                .
              </p>
            )}
            <Link
              href={getSupportMailto("DanCruShop support")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {supportEmail}
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DanCruShop. Tools, source code, and
          digital resources for builders.
        </div>
      </div>
    </footer>
  );
}
