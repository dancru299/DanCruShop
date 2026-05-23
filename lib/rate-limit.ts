type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimiter = {
  max: number;
  store: Map<string, RateLimitEntry>;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

// NOTE: In-memory only — resets on cold start and does not sync across
// multiple serverless instances. Sufficient for MVP; replace with
// Upstash Redis or a Supabase table for multi-instance production use.
export function createRateLimiter(options: {
  max: number;
  windowMs: number;
}): RateLimiter {
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

export function getClientIp(headers: { get(key: string): string | null }): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}
