"use client";

import { forwardRef } from "react";

/**
 * Terminal-style header shown above the command input:
 *   $ dancru-shop >
 *
 * The blinking caret is animated via CSS `@keyframes blink` in globals.css.
 */
export const PalettePrompt = forwardRef<
  HTMLSpanElement,
  Record<string, never>
>(function PalettePrompt(_props, ref) {
  return (
    <div
      className="flex items-center gap-2 px-4 pt-4 font-mono text-sm select-none"
      aria-hidden="true"
    >
      <span className="text-emerald-400">$</span>
      <span className="text-muted-foreground">dancru-shop</span>
      <span ref={ref} className="text-foreground">
        {">"}
      </span>
      <span
        className="ml-0.5 inline-block h-4 w-2 bg-foreground align-middle animate-blink"
        aria-hidden="true"
      />
    </div>
  );
});