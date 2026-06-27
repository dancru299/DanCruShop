"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  WalletIcon,
} from "lucide-react";

import {
  claimFreeProduct,
  createPayPalCheckout,
} from "@/actions/checkout.actions";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/products/display";
import type { ProductType } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

export type BuyBoxOption = {
  // The variant id — the purchasable identity used for cart/checkout/download.
  id: string;
  productId: string;
  title: string;
  slug: string;
  productType: ProductType;
  optionLabel: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  currency: string;
  isFree: boolean;
};

type ProductBuyBoxProps = {
  activeOptionId: string;
  demoUrl: string | null;
  lemonSqueezyUrl: string | null;
  options: BuyBoxOption[];
  previewUrl: string | null;
  purchasedOptionIds: string[];
  thumbnailUrl: string | null;
};

function priceLabel(option: BuyBoxOption) {
  return option.isFree
    ? "Free"
    : formatPrice(option.priceCents, option.currency);
}

function SubmitButton({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant={variant}
      disabled={pending}
      className={cn("w-full", className)}
    >
      {pending ? "Preparing checkout..." : children}
    </Button>
  );
}

export function ProductBuyBox({
  activeOptionId,
  demoUrl,
  lemonSqueezyUrl,
  options,
  previewUrl,
  purchasedOptionIds,
  thumbnailUrl,
}: ProductBuyBoxProps) {
  const [selectedId, setSelectedId] = useState(activeOptionId);
  const selected =
    options.find((option) => option.id === selectedId) ?? options[0];

  if (!selected) {
    return null;
  }

  const isPurchased = purchasedOptionIds.includes(selected.id);
  const discount =
    !selected.isFree &&
    selected.compareAtPriceCents != null &&
    selected.compareAtPriceCents > selected.priceCents
      ? selected.compareAtPriceCents
      : null;

  const cartProduct = {
    currency: selected.currency,
    id: selected.id,
    isFree: selected.isFree,
    priceCents: selected.priceCents,
    productType: selected.productType,
    slug: selected.slug,
    thumbnailUrl,
    title: selected.title,
  };

  return (
    <div className="flex flex-col gap-4">
      {options.length > 1 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Choose an option</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const active = option.id === selected.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(option.id)}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg border bg-card/60 p-3 text-left text-sm shadow-sm backdrop-blur-xl transition-[border-color,background-color]",
                    active
                      ? "border-primary ring-1 ring-primary/40"
                      : "hover:border-foreground/35"
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium text-foreground">
                      {option.optionLabel?.trim() || option.title}
                    </span>
                    <span className="text-muted-foreground">
                      {priceLabel(option)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent group-hover:border-foreground/40"
                    )}
                  >
                    <CheckIcon aria-hidden="true" className="size-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-end justify-between gap-4 border-y py-4">
        <div>
          <p className="text-sm text-muted-foreground">Price</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tracking-normal">
              {priceLabel(selected)}
            </p>
            {discount ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(discount, selected.currency)}
              </span>
            ) : null}
          </div>
        </div>
        <Badge variant="outline">Secure payment</Badge>
      </div>

      {/* Primary CTA — single, prominent. */}
      {isPurchased ? (
        <Button
          size="lg"
          className="w-full"
          render={<Link href={`/dashboard/products/${selected.productId}`} />}
          nativeButton={false}
        >
          Open dashboard
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      ) : selected.isFree ? (
        <form action={claimFreeProduct.bind(null, selected.id)}>
          <SubmitButton>Get it free</SubmitButton>
        </form>
      ) : (
        <Dialog>
          <DialogTrigger
            render={
              <Button size="lg" className="w-full">
                Buy now — {formatPrice(selected.priceCents, selected.currency)}
              </Button>
            }
          />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choose how to pay</DialogTitle>
              <DialogDescription>
                {selected.optionLabel?.trim() || selected.title} ·{" "}
                {formatPrice(selected.priceCents, selected.currency)}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="grid gap-3">
              <form action={createPayPalCheckout.bind(null, selected.id)}>
                <SubmitButton className="justify-start">
                  <WalletIcon aria-hidden="true" data-icon="inline-start" />
                  Pay with PayPal or card
                </SubmitButton>
              </form>

              {lemonSqueezyUrl ? (
                <>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    or
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full justify-start"
                    render={
                      <Link
                        href={lemonSqueezyUrl}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                    nativeButton={false}
                  >
                    Buy on Lemon Squeezy
                    <ExternalLinkIcon
                      aria-hidden="true"
                      data-icon="inline-end"
                    />
                  </Button>
                </>
              ) : null}

              <p className="text-xs leading-5 text-muted-foreground">
                PayPal unlocks your products automatically after payment.
              </p>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}

      {/* Secondary actions — smaller, set apart from the main CTA. */}
      {!isPurchased ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <AddToCartButton
            product={cartProduct}
            size="sm"
            variant="outline"
          >
            Add to cart
          </AddToCartButton>
          {demoUrl ? (
            <Link
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View demo
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
          {previewUrl ? (
            <Link
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View preview
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
