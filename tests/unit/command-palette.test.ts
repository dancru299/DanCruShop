import { describe, expect, it, vi } from "vitest";

import {
  getPaletteCommands,
  buildSearchAllCommand,
  type PaletteActionContext,
} from "@/lib/command-palette/commands";

function makeContext(
  overrides: Partial<PaletteActionContext> = {}
): PaletteActionContext {
  return {
    router: { push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() } as any,
    setTheme: vi.fn(),
    theme: "light",
    closePalette: vi.fn(),
    isAuthenticated: false,
    cartItemCount: 0,
    ...overrides,
  };
}

describe("getPaletteCommands", () => {
  it("renders 'Log in' when not authenticated", () => {
    const ctx = makeContext({ isAuthenticated: false });
    const commands = getPaletteCommands(ctx);
    const loginCmd = commands.find((c) => c.id === "login");
    expect(loginCmd).toBeDefined();
    expect(loginCmd!.hint).toBe("/login");
    expect(loginCmd!.label).toBe("Log in");
  });

  it("renders 'Dashboard' when authenticated", () => {
    const ctx = makeContext({ isAuthenticated: true });
    const commands = getPaletteCommands(ctx);
    const dashboardCmd = commands.find((c) => c.id === "dashboard");
    expect(dashboardCmd).toBeDefined();
    expect(dashboardCmd!.hint).toBe("/dashboard");
    expect(dashboardCmd!.label).toBe("Dashboard");
  });

  it("renders cart command with badge when items exist", () => {
    const ctx = makeContext({ cartItemCount: 3 });
    const commands = getPaletteCommands(ctx);
    const cartCmd = commands.find((c) => c.id === "cart");
    expect(cartCmd).toBeDefined();
    expect(cartCmd!.badge).toBe("3");
  });

  it("renders cart command without badge when empty", () => {
    const ctx = makeContext({ cartItemCount: 0 });
    const commands = getPaletteCommands(ctx);
    const cartCmd = commands.find((c) => c.id === "cart");
    expect(cartCmd).toBeDefined();
    expect(cartCmd!.badge).toBeUndefined();
  });

  it("renders 'Switch to dark mode' when theme is light", () => {
    const ctx = makeContext({ theme: "light" });
    const commands = getPaletteCommands(ctx);
    const themeCmd = commands.find((c) => c.id === "theme");
    expect(themeCmd).toBeDefined();
    expect(themeCmd!.label).toContain("dark");
  });

  it("renders 'Switch to light mode' when theme is dark", () => {
    const ctx = makeContext({ theme: "dark" });
    const commands = getPaletteCommands(ctx);
    const themeCmd = commands.find((c) => c.id === "theme");
    expect(themeCmd).toBeDefined();
    expect(themeCmd!.label).toContain("light");
  });

  it("contains all required navigation commands", () => {
    const ctx = makeContext();
    const commands = getPaletteCommands(ctx);
    const ids = commands.map((c) => c.id);
    expect(ids).toContain("products");
    expect(ids).toContain("cart");
    expect(ids).toContain("favorites");
    expect(ids).toContain("compare");
    expect(ids).toContain("blog");
    expect(ids).toContain("support");
    expect(ids).toContain("profile");
    expect(ids).toContain("settings");
    expect(ids).toContain("theme");
  });

  it("cart command navigates to /cart and closes palette", () => {
    const ctx = makeContext();
    const commands = getPaletteCommands(ctx);
    const cartCmd = commands.find((c) => c.id === "cart")!;
    cartCmd.perform(ctx);
    expect(ctx.router.push).toHaveBeenCalledWith("/cart");
    expect(ctx.closePalette).toHaveBeenCalled();
  });

  it("theme command toggles from light to dark", () => {
    const ctx = makeContext({ theme: "light" });
    const commands = getPaletteCommands(ctx);
    const themeCmd = commands.find((c) => c.id === "theme")!;
    themeCmd.perform(ctx);
    expect(ctx.setTheme).toHaveBeenCalledWith("dark");
  });
});

describe("buildSearchAllCommand", () => {
  it("builds correct search-all command with query", () => {
    const ctx = makeContext();
    const cmd = buildSearchAllCommand("nextjs", ctx);
    expect(cmd.id).toBe("search-all");
    expect(cmd.hint).toBe("/products?q=nextjs");
    expect(cmd.keywords).toContain("nextjs");
  });

  it("navigates to /products?q= when performed", () => {
    const ctx = makeContext();
    const cmd = buildSearchAllCommand("tailwind", ctx);
    cmd.perform(ctx);
    expect(ctx.router.push).toHaveBeenCalledWith("/products?q=tailwind");
    expect(ctx.closePalette).toHaveBeenCalled();
  });

  it("URL-encodes special characters", () => {
    const ctx = makeContext();
    const cmd = buildSearchAllCommand("c++ & more", ctx);
    expect(cmd.hint).toContain("c%2B%2B%20%26%20more");
  });
});