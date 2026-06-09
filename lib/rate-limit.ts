import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimiter = {
  max: number;
  store: Map<string, RateLimitEntry>;
  windowMs: number;
};

export type RateLimitOptions = {
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

// In-memory limiter — single process only, resets on cold start. Used as the
// graceful fallback inside enforceRateLimit() when the Supabase-backed limiter
// is unavailable, and remains handy for local or non-critical checks.
export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  return {
    max: options.max,
    store: new Map(),
    windowMs: options.windowMs,
  };
}

export function checkRateLimit(
  limiter: RateLimiter,
  key: string
): RateLimitResult {
  const now = Date.now();
  const entry = limiter.store.get(key);

  if (!entry || now >= entry.resetAt) {
    limiter.store.set(key, { count: 1, resetAt: now + limiter.windowMs });
    return { allowed: true, remaining: limiter.max - 1 };
  }

  if (entry.count >= limiter.max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limiter.max - entry.count };
}

// One in-memory limiter per (max, windowMs) config so distinct endpoints keep
// independent counters even on the degraded fallback path.
const fallbackLimiters = new Map<string, RateLimiter>();

function getFallbackLimiter(options: RateLimitOptions): RateLimiter {
  const id = `${options.max}:${options.windowMs}`;
  const existing = fallbackLimiters.get(id);

  if (existing) {
    return existing;
  }

  const limiter = createRateLimiter(options);
  fallbackLimiters.set(id, limiter);

  return limiter;
}

type ConsumeRateLimitRow = {
  allowed: boolean;
  remaining: number;
};

// Distributed fixed-window rate limit shared across every serverless instance
// via the public.consume_rate_limit Postgres function (see
// supabase/rate-limits.sql). If the RPC is unreachable we fall back to a local
// in-memory limiter — fail-degraded rather than fail-open.
export async function enforceRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_key: key,
      p_max: options.max,
      p_window_ms: options.windowMs,
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | ConsumeRateLimitRow
      | undefined;

    if (!row || typeof row.allowed !== "boolean") {
      throw new Error("Unexpected consume_rate_limit response.");
    }

    return { allowed: row.allowed, remaining: row.remaining ?? 0 };
  } catch (error) {
    console.error(
      "Distributed rate limit unavailable; using in-memory fallback",
      { error, key }
    );

    return checkRateLimit(getFallbackLimiter(options), key);
  }
}

export function getClientIp(headers: { get(key: string): string | null }): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}
