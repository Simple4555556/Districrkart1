/**
 * Simple in-memory rate limiter.
 * Resets on server restart. Suitable for single-instance deployments.
 * For multi-instance / production, swap the Map for Redis (e.g. Upstash).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Prune expired entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, rec] of Array.from(store.entries())) {
      if (now > rec.resetAt) store.delete(key);
    }
  }, 10 * 60 * 1_000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms
}

/**
 * @param key       Unique identifier (e.g. `ip:register`, `email:login`)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const rec = store.get(key);

  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (rec.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: rec.resetAt };
  }

  rec.count += 1;
  return { allowed: true, remaining: limit - rec.count, resetAt: rec.resetAt };
}

/** Helper: extract best-effort IP from Next.js request headers. */
export function getClientIp(req: Request): string {
  const headers = (req as any).headers as Headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
