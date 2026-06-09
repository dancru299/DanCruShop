import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DanCruShopMarkProps = HTMLAttributes<SVGSVGElement>;

export function DanCruShopMark({
  className,
  ...props
}: DanCruShopMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-6", className)}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18 17h14c9.7 0 16 6.3 16 15s-6.3 15-16 15H18V17Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M29 25l-5.8 7 5.8 7M39 25l5.8 7-5.8 7M34.5 41l5-18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.4"
      />
    </svg>
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
    <span className={cn("inline-flex items-center gap-3", className)} {...props}>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-primary text-primary-foreground shadow-sm shadow-black/10",
          markContainerClassName
        )}
      >
        <DanCruShopMark className={cn("size-6", markClassName)} />
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
