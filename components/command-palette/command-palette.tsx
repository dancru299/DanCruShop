"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import { Loader2Icon } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import { PalettePrompt } from "@/components/command-palette/palette-prompt";
import { PaletteProductCommandItem } from "@/components/command-palette/palette-product-item";
import { usePaletteSearch } from "@/components/command-palette/use-palette-search";
import {
  getPaletteCommands,
  buildSearchAllCommand,
  type PaletteCommand,
  type PaletteActionContext,
} from "@/lib/command-palette/commands";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { useCart } from "@/components/cart/cart-provider";
import { claimDevDiscount } from "@/actions/easter-egg.actions";
import { toast } from "sonner";

// ── "help" easter egg ASCII art ──────────────────────────────────
const HELP_ASCII = [
  "╔══════════════════════════════════════╗",
  "║        DanCruShop — Dev Mode         ║",
  "╠══════════════════════════════════════╣",
  "║                                      ║",
  "║  Hidden commands:                    ║",
  "║    help          Show this message   ║",
  "║    sudo discount Claim dev discount  ║",
  "║                                      ║",
  "║  Shortcuts:                          ║",
  "║    ⌘K / Ctrl+K  Open this palette   ║",
  "║    /            Open palette         ║",
  "║    ↑↓           Navigate             ║",
  "║    ↵            Select               ║",
  "║    esc          Close                ║",
  "║                                      ║",
  "╚══════════════════════════════════════╝",
].join("\n");

/**
 * Client-side filter of static commands by query.
 * cmdk `shouldFilter={false}` disables built-in filtering, so we do it
 * manually: match against label + keywords.
 */
function filterCommands(commands: PaletteCommand[], query: string): PaletteCommand[] {
  if (!query.trim()) return commands;
  const lower = query.trim().toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(lower) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(lower))
  );
}

/**
 * Global command palette — Base UI Dialog wrapping cmdk <Command>.
 * Mounted once in app/layout.tsx; toggled via useCommandPalette context.
 */
export function CommandPalette() {
  const router = useRouter();
  const { open, setOpen, closePalette } = useCommandPalette();
  const { theme, setTheme } = useTheme();
  const { itemCount } = useCart();
  const { results, loading, query, setQuery } = usePaletteSearch();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sudoState, setSudoState] = useState<
    | { type: "idle" }
    | { type: "loading" }
    | { type: "success"; code: string; expiresAt: string }
    | { type: "error"; reason: string }
  >({ type: "idle" });
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ── Auth check — lightweight: check Supabase session via getUser() on open ─
  // The state update runs only after the async getUser() resolves (never
  // synchronously inside the effect) and is guarded so it can't fire after the
  // palette has closed or unmounted.
  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        // Dynamically import to avoid bundling into every page
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (active) {
          setIsAuthenticated(!!data.user);
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [open]);

  // ── Analytics ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      trackAnalyticsEvent("command_palette_open");
    }
  }, [open]);

  // ── Reset query & state on close ────────────────────────────────
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setSudoState({ type: "idle" });
    }
  }

  // ── Build command list ──────────────────────────────────────────
  const ctx: PaletteActionContext = useMemo(
    () => ({
      router,
      setTheme,
      theme,
      closePalette,
      isAuthenticated,
      cartItemCount: itemCount,
    }),
    [router, setTheme, theme, closePalette, isAuthenticated, itemCount]
  );

  const allCommands = useMemo(() => getPaletteCommands(ctx), [ctx]);

  // A leading "/" marks a command (e.g. "/cart", "/theme"): strip it before
  // matching, and skip product search so it's treated purely as a command.
  const trimmedQuery = query.trim();
  const isSlashCommand = trimmedQuery.startsWith("/");
  const commandQuery = trimmedQuery.replace(/^\//, "");

  // Filter static commands client-side when query is present
  const navCommands = useMemo(
    () =>
      filterCommands(
        allCommands.filter((c) =>
          ["products", "cart", "favorites", "compare", "blog", "support", "profile", "settings", "dashboard", "login"].includes(c.id)
        ),
        commandQuery
      ),
    [allCommands, commandQuery]
  );

  const themeCommands = useMemo(
    () => filterCommands(allCommands.filter((c) => c.id === "theme"), commandQuery),
    [allCommands, commandQuery]
  );

  const hasResults = results.length > 0;
  const hasQuery = trimmedQuery.length >= 2;
  const isHelp = query.trim().toLowerCase() === "help";
  const isSudo = query.trim().toLowerCase() === "sudo discount";

  // ── Easter-egg early-return: show dedicated view, no product search ─
  if (open && (isHelp || isSudo)) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false} className="max-w-xl gap-0 p-0">
          <Command shouldFilter={false} className="flex flex-col">
            <PalettePrompt />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search products, type /cart, or toggle theme…"
              autoFocus
              className="border-0 bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            {isHelp ? (
              <div className="flex flex-col gap-3 px-4 py-6">
                <pre className="font-mono text-xs leading-5 text-emerald-400 whitespace-pre select-text">
                  {HELP_ASCII}
                </pre>
                <p className="text-xs text-muted-foreground">
                  Psst... try{" "}
                  <code className="rounded bg-muted px-1 font-mono text-foreground">
                    sudo discount
                  </code>{" "}
                  for a surprise.
                </p>
              </div>
            ) : (
              <SudoDiscount
                state={sudoState}
                onClaim={async () => {
                  setSudoState({ type: "loading" });
                  const result = await claimDevDiscount();
                  if (result.ok) {
                    setSudoState({
                      type: "success",
                      code: result.code,
                      expiresAt: result.expiresAt,
                    });
                    toast.success("Dev discount code generated! Copy it and apply at checkout.");
                  } else {
                    setSudoState({ type: "error", reason: result.reason });
                  }
                }}
                onCopy={(code) => {
                  navigator.clipboard.writeText(code).catch(() => {});
                  toast.success("Coupon code copied!");
                }}
              />
            )}
          </Command>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-xl gap-0 p-0"
      >
        <Command
          shouldFilter={false} // we filter product via Server Action, commands client-side
          className="flex flex-col"
        >
          <PalettePrompt />

          <Command.Input
            ref={(el) => {
              inputRef.current = el;
            }}
            value={query}
            onValueChange={setQuery}
            placeholder="Search products, type /cart, or toggle theme…"
            autoFocus
            className="border-0 bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />

          <Command.List className="max-h-72 overflow-y-auto px-2 pb-2">
            {/* ── Product results (dynamic; skipped for slash-commands) ── */}
            {isSlashCommand ? null : loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
                Searching…
              </div>
            ) : hasResults ? (
              <Command.Group heading="Products">
                {results.map((product) => (
                  <PaletteProductCommandItem
                    key={product.id}
                    product={product}
                    onSelect={() => {
                      trackAnalyticsEvent("command_palette_product_select", {
                        productId: product.id,
                      });
                    }}
                  />
                ))}
              </Command.Group>
            ) : null}

            {/* ── Search all (when query entered but no results) ── */}
            {!isSlashCommand && hasQuery && !loading && !hasResults ? (
              <Command.Group heading="Search">
                <Command.Item
                  value="search-all"
                  onSelect={() => {
                    const cmd = buildSearchAllCommand(query, ctx);
                    cmd.perform(ctx);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors data-[selected=true]:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      Search &ldquo;{query.trim()}&rdquo; in all products
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /products?q=
                      {encodeURIComponent(query.trim())}
                    </p>
                  </div>
                </Command.Item>
              </Command.Group>
            ) : null}

            {/* ── Navigation commands (client-side filtered) ── */}
            {navCommands.length > 0 ? (
              <Command.Group heading="Navigation">
                {navCommands.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.id}
                    keywords={cmd.keywords}
                    onSelect={() => {
                      trackAnalyticsEvent("command_palette_navigate");
                      cmd.perform(ctx);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors data-[selected=true]:bg-muted/60"
                  >
                    <cmd.icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="flex-1 truncate">{cmd.label}</span>
                    {cmd.hint ? (
                      <span className="text-xs text-muted-foreground/60">
                        {cmd.hint}
                      </span>
                    ) : null}
                    {cmd.badge ? (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                        {cmd.badge}
                      </span>
                    ) : null}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {/* ── Theme (client-side filtered) ── */}
            {themeCommands.length > 0 ? (
              <Command.Group heading="Theme">
                {themeCommands.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.id}
                    keywords={cmd.keywords}
                    onSelect={() => cmd.perform(ctx)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors data-[selected=true]:bg-muted/60"
                  >
                    <cmd.icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="flex-1 truncate">{cmd.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {/* ── Empty state: no static commands, no product results ── */}
            {!loading && !hasResults && navCommands.length === 0 && themeCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type to search products, or try /cart, /theme…
              </div>
            ) : null}
          </Command.List>

          {/* ── Footer ── */}
          <div className="border-t px-4 py-2 text-[11px] text-muted-foreground/50 select-none">
            ↑↓ to navigate · ↵ to select · esc to close
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// ── "sudo discount" inline component ─────────────────────────────

type SudoState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; code: string; expiresAt: string }
  | { type: "error"; reason: string };

function SudoDiscount({
  state,
  onClaim,
  onCopy,
}: {
  state: SudoState;
  onClaim: () => void;
  onCopy: (code: string) => void;
}) {
  if (state.type === "idle") {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-8">
        <pre className="font-mono text-xs leading-5 text-amber-400 whitespace-pre select-text">
          {[
            "     *",
            "    ***",
            "   *****",
            "  *******",
            " ****dev****",
            "  *******",
            "   *****",
            "    ***",
            "     *",
          ].join("\n")}
        </pre>
        <p className="text-sm text-muted-foreground text-center">
          You found the dev discount! Click below to claim a{" "}
          <strong className="text-foreground">single-use 10% off</strong> coupon.
        </p>
        <button
          type="button"
          onClick={onClaim}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Claim discount
        </button>
      </div>
    );
  }

  if (state.type === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-8">
        <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Generating your code…</span>
      </div>
    );
  }

  if (state.type === "success") {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-8">
        <p className="text-sm font-medium text-emerald-400">🎉 Code generated!</p>
        <code className="rounded-lg bg-muted px-4 py-2 font-mono text-lg font-semibold text-foreground select-all">
          {state.code}
        </code>
        <p className="text-xs text-muted-foreground">
          Expires {new Date(state.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onCopy(state.code)}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Copy code
          </button>
        </div>
      </div>
    );
  }

  if (state.type === "error") {
    const messages: Record<string, string> = {
      rate_limited: "You're doing that too often. Try again tomorrow.",
      not_authenticated: "Log in to claim your dev discount.",
      already_claimed: "You've already claimed your dev discount.",
      budget_exhausted: "All dev discount codes have been claimed for now.",
    };

    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8">
        <p className="text-sm text-muted-foreground">
          {messages[state.reason] ?? "Something went wrong. Try again later."}
        </p>
      </div>
    );
  }

  return null;
}