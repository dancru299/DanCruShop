"use client";

import { useSyncExternalStore } from "react";
import { SearchIcon } from "lucide-react";

import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "Search Office, Canva, ChatGPT...",
  "Search accounts, license keys...",
  "Search source code, templates...",
  "Search AI tools, VPN...",
];

// The shortcut label never changes after mount, so there is nothing to
// subscribe to — return a no-op unsubscribe.
const subscribeToShortcut = () => () => {};

function getShortcutKey() {
  return navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl+K";
}

/**
 * Header entry button for the global command palette.
 *
 * Replaces the old inline search form — all product/command search now
 * happens inside the palette (⌘K or click this button).
 * The button keeps the original visual shape (search icon, rotating
 * placeholder, keyboard badge) so the header looks unchanged.
 */
export function HeaderSearch({ className }: { className?: string }) {
  const { openPalette } = useCommandPalette();
  // Read the platform-specific shortcut label on the client without a hydration
  // mismatch: the server snapshot renders "Ctrl+K", then the client swaps in the
  // real value after hydration. Keeping this in a store (not an effect) avoids a
  // synchronous setState during render/commit.
  const shortcutKey = useSyncExternalStore(
    subscribeToShortcut,
    getShortcutKey,
    () => "Ctrl+K"
  );

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Open command palette"
      className={cn(
        "relative flex h-11 w-full items-center rounded-full border border-border/80 bg-card pl-10 pr-16 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-border",
        className
      )}
    >
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <span className="truncate">{PLACEHOLDERS[0]}</span>
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground lg:inline-flex">
        {shortcutKey}
      </kbd>
    </button>
  );
}
