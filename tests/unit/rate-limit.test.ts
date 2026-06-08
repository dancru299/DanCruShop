import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkRateLimit,
  createRateLimiter,
  getClientIp,
} from "@/lib/rate-limit";

describe("rate limiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests until the configured limit is reached", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const limiter = createRateLimiter({ max: 2, windowMs: 1_000 });

    expect(checkRateLimit(limiter, "client-a")).toEqual({
      allowed: true,
      remaining: 1,
    });
    expect(checkRateLimit(limiter, "client-a")).toEqual({
      allowed: true,
      remaining: 0,
    });
    expect(checkRateLimit(limiter, "client-a")).toEqual({
      allowed: false,
      remaining: 0,
    });
  });

  it("opens a new window after reset time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const limiter = createRateLimiter({ max: 1, windowMs: 1_000 });

    expect(checkRateLimit(limiter, "client-a").allowed).toBe(true);
    expect(checkRateLimit(limiter, "client-a").allowed).toBe(false);

    vi.setSystemTime(new Date("2026-01-01T00:00:01.001Z"));

    expect(checkRateLimit(limiter, "client-a")).toEqual({
      allowed: true,
      remaining: 0,
    });
  });
});

describe("getClientIp", () => {
  it("uses the first forwarded IP", () => {
    const headers = new Map([["x-forwarded-for", "203.0.113.7, 10.0.0.1"]]);

    expect(getClientIp({ get: (key) => headers.get(key) ?? null })).toBe(
      "203.0.113.7"
    );
  });

  it("falls back when no forwarded IP is present", () => {
    expect(getClientIp({ get: () => null })).toBe("unknown");
  });
});
