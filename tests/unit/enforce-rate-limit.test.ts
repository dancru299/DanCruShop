import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import { enforceRateLimit } from "@/lib/rate-limit";

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards the key and limits to the consume_rate_limit RPC", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 4 }], error: null });

    const result = await enforceRateLimit("magic-link:1.2.3.4", {
      max: 5,
      windowMs: 60_000,
    });

    expect(result).toEqual({ allowed: true, remaining: 4 });
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_key: "magic-link:1.2.3.4",
      p_max: 5,
      p_window_ms: 60_000,
    });
  });

  it("blocks when the RPC reports the window is exhausted", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: false, remaining: 0 }], error: null });

    expect(
      await enforceRateLimit("download:1.2.3.4:slug", { max: 1, windowMs: 1_000 })
    ).toEqual({ allowed: false, remaining: 0 });
  });

  it("falls back to an in-memory limiter when the RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db unavailable" } });

    const options = { max: 2, windowMs: 60_000 };

    expect((await enforceRateLimit("fallback-key", options)).allowed).toBe(true);
    expect((await enforceRateLimit("fallback-key", options)).allowed).toBe(true);
    expect((await enforceRateLimit("fallback-key", options)).allowed).toBe(false);
  });
});
