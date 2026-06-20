import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DanCruShopMarkProps = HTMLAttributes<HTMLImageElement>;

export function DanCruShopMark({
  className,
  ...props
}: DanCruShopMarkProps) {
  return (
    // Static, fixed-size brand mark. next/image optimization adds no value for a
    // tiny inline icon and would change the HTMLImageElement prop contract this
    // component spreads onto callers.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo_cyberwing_mark.png"
      alt="DanCruShop Logo Mark"
      className={cn("size-6 object-contain", className)}
      {...props}
    />
  );
}

type DanCruShopLogoProps = HTMLAttributes<HTMLSpanElement> & {
  eyebrow?: string;
  eyebrowClassName?: string;
  markClassName?: string;
  markContainerClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function DanCruShopLogo({
  className,
  eyebrow,
  eyebrowClassName,
  markClassName,
  markContainerClassName,
  showWordmark = true,
  wordmarkClassName,
  ...props
}: DanCruShopLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} {...props}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center",
          markContainerClassName
        )}
      >
        <DanCruShopMark className={cn("size-7", markClassName)} />
      </span>
      {showWordmark ? (
        <span className="grid min-w-0 gap-0.5">
          {eyebrow ? (
            <span
              className={cn(
                "text-xs font-medium leading-none text-muted-foreground",
                eyebrowClassName
              )}
            >
              {eyebrow}
            </span>
          ) : null}
          <span
            className={cn(
              "truncate text-base font-semibold leading-none tracking-normal text-foreground",
              wordmarkClassName
            )}
          >
            DanCruShop
          </span>
        </span>
      ) : null}
    </span>
  );
}
