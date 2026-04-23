// In-memory, per-instance rate limiter. Meant as the first-pass guard on
// the chat API — fine for a single Vercel function region with modest
// traffic. Swap for a Redis (Upstash) backend when we scale horizontally.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 50;

// Prune entries whose reset window has already elapsed. Called on every
// check — the Map should stay small (active users per 24h) so this is
// cheap enough that a periodic timer isn't needed.
function cleanup(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
): RateLimitResult {
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
