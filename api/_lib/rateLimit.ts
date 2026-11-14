import type { ServerResponse } from 'node:http';

interface RateLimitBucket {
  timestamps: number[];
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * In-memory sliding window rate limiter for serverless functions.
 */
export function checkRateLimit(
  identifier: string,
  limit = 30,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let bucket = buckets.get(identifier);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(identifier, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const resetMs = Math.max(1000, oldest + windowMs - now);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs,
    };
  }

  bucket.timestamps.push(now);

  // Periodic cleanup to avoid unbounded map growth
  if (buckets.size > 2000) {
    for (const [key, val] of buckets.entries()) {
      const active = val.timestamps.filter((ts) => ts > windowStart);
      if (active.length === 0) {
        buckets.delete(key);
      } else {
        val.timestamps = active;
      }
    }
  }

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    resetMs: windowMs,
  };
}

export function applyRateLimitHeaders(res: ServerResponse, result: RateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', String(result.limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetMs / 1000)));
}

export function resetRateLimitStore(): void {
  buckets.clear();
}
