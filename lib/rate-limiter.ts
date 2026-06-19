// Rate limiter for the chat API. Prefers a shared store (Vercel KV / Upstash
// Redis) so the limit holds across serverless instances and cold starts; falls
// back to a per-instance in-memory map when no store is configured (local dev,
// or before the KV integration is provisioned).

import { Redis } from "@upstash/redis";

const DAY_SECONDS = 24 * 60 * 60;
const DAY_MS = DAY_SECONDS * 1000;
const DEFAULT_LIMIT = 50;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

// ---- shared store (Vercel KV / Upstash Redis) ----------------------------
// Supports both env-var conventions: KV_REST_API_* (Vercel KV integration) and
// UPSTASH_REDIS_REST_* (Upstash directly). `undefined` = not yet resolved;
// `null` = resolved and unavailable (use the in-memory fallback).
let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

// Atomic fixed-window counter: INCR the key, set a 24h TTL on first write.
async function checkRedis(
  client: Redis,
  key: string,
  limit: number,
): Promise<RateLimitResult> {
  const k = `rl:${key}`;
  const count = await client.incr(k);
  if (count === 1) {
    await client.expire(k, DAY_SECONDS);
  }
  // resetAt is approximate (window start ≈ now on the first hit); it is not
  // currently surfaced to clients, so an exact TTL read isn't worth the round trip.
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + DAY_MS,
    limit,
  };
}

// ---- in-memory fallback (per-instance) -----------------------------------
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function cleanup(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function checkMemory(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + DAY_MS;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, limit };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt, limit };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    limit,
  };
}

export async function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
): Promise<RateLimitResult> {
  const client = getRedis();
  if (client) {
    try {
      return await checkRedis(client, key, limit);
    } catch (err) {
      // Don't let a transient store outage take down chat — degrade to the
      // per-instance limiter rather than failing the request.
      console.warn(
        "[rate-limiter] shared store check failed, using in-memory fallback: %s",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
  return checkMemory(key, limit);
}
