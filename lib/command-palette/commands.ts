import {
  ShoppingCartIcon,
  HeartIcon,
  GitCompareIcon,
  PackageIcon,
  FileTextIcon,
  LifeBuoyIcon,
  UserIcon,
  SettingsIcon,
  LogInIcon,
  LayoutDashboardIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export type PaletteActionContext = {
  router: AppRouterInstance;
  setTheme: (theme: string) => void;
  theme: string | undefined;
  closePalette: () => void;
  /** Non-null when the user is authenticated. */
  isAuthenticated: boolean;
  /** Cart item count badge. */
  cartItemCount: number;
};

export type PaletteCommand = {
  id: string;
  label: string;
  hint?: string;
  keywords: string[];
  icon: LucideIcon;
  perform: (ctx: PaletteActionContext) => void;
  /** Badge shown beside the label (e.g. cart count, "New"). */
  badge?: string;
};

/**
 * Static command registry for the command palette.
 *
 * Commands are grouped by section: Navigation, Theme, Actions.
 * The product search group is dynamic and handled separately
 * via `searchProductsForPalette`.
 */
export function getPaletteCommands(ctx: PaletteActionContext): PaletteCommand[] {
  const { isAuthenticated, cartItemCount, router, setTheme, theme, closePalette } = ctx;

  const isDark = theme === "dark";

  return [
    // ── Navigation ──
    {
      id: "products",
      label: "Browse all products",
      hint: "/products",
      keywords: ["products", "catalog", "shop", "store"],
      icon: PackageIcon,
      perform: () => {
        router.push("/products");
        closePalette();
      },
    },
    {
      id: "cart",
      label: "Go to cart",
      hint: "/cart",
      keywords: ["cart", "checkout", "bag", "basket"],
      icon: ShoppingCartIcon,
      badge: cartItemCount > 0 ? String(cartItemCount) : undefined,
      perform: () => {
        router.push("/cart");
        closePalette();
      },
    },
    {
      id: "favorites",
      label: "View favorites",
      hint: "/favorites",
      keywords: ["favorites", "wishlist", "saved", "bookmark"],
      icon: HeartIcon,
      perform: () => {
        router.push("/favorites");
        closePalette();
      },
    },
    {
      id: "compare",
      label: "Compare products",
      hint: "/compare",
      keywords: ["compare", "specs", "versus", "diff"],
      icon: GitCompareIcon,
      perform: () => {
        router.push("/compare");
        closePalette();
      },
    },
    {
      id: "blog",
      label: "Read the blog",
      hint: "/blog",
      keywords: ["blog", "articles", "news", "posts"],
      icon: FileTextIcon,
      perform: () => {
        router.push("/blog");
        closePalette();
      },
    },
    {
      id: "support",
      label: "Help & support",
      hint: "/support",
      keywords: ["support", "help", "contact", "faq"],
      icon: LifeBuoyIcon,
      perform: () => {
        router.push("/support");
        closePalette();
      },
    },
    {
      id: "profile",
      label: "Your profile",
      hint: "/profile",
      keywords: ["profile", "account", "user"],
      icon: UserIcon,
      perform: () => {
        router.push("/profile");
        closePalette();
      },
    },
    {
      id: "settings",
      label: "Settings",
      hint: "/settings",
      keywords: ["settings", "preferences", "config"],
      icon: SettingsIcon,
      perform: () => {
        router.push("/settings");
        closePalette();
      },
    },
    {
      id: isAuthenticated ? "dashboard" : "login",
      label: isAuthenticated ? "Dashboard" : "Log in",
      hint: isAuthenticated ? "/dashboard" : "/login",
      keywords: isAuthenticated
        ? ["dashboard", "admin"]
        : ["login", "signin", "auth", "signup"],
      icon: isAuthenticated ? LayoutDashboardIcon : LogInIcon,
      perform: () => {
        router.push(isAuthenticated ? "/dashboard" : "/login");
        closePalette();
      },
    },

    // ── Theme ──
    {
      id: "theme",
      label: isDark ? "Switch to light mode" : "Switch to dark mode",
      hint: "Toggle theme",
      keywords: ["theme", "dark", "light", "mode", "color"],
      icon: isDark ? SunIcon : MoonIcon,
      perform: () => {
        setTheme(isDark ? "light" : "dark");
        closePalette();
      },
    },
  ];
}

/**
 * The "Search all" pseudo-command rendered when the user types a query
 * that didn't produce product results (or as the bottom option).
 */
export function buildSearchAllCommand(
  query: string,
  ctx: PaletteActionContext
): PaletteCommand {
  const trimmed = query.trim();
  return {
    id: "search-all",
    label: `Search "${trimmed}" in all products`,
    hint: `/products?q=${encodeURIComponent(trimmed)}`,
    keywords: [trimmed, "search"],
    icon: SearchIcon,
    perform: () => {
      ctx.router.push(`/products?q=${encodeURIComponent(trimmed)}`);
      ctx.closePalette();
    },
  };
}