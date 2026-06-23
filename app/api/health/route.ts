import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { getClient, PRIMARY_MODEL, FALLBACK_MODEL } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Constant-time secret comparison. Hashing both sides to a fixed 32 bytes keeps
// it constant-time regardless of length (timingSafeEqual requires equal-length
// buffers) and avoids leaking the secret length.
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// Tiny real Claude call so monitoring can verify the whole chat path end to
// end — API key valid, model reachable, network egress working — not just that
// the Next.js process is up.
const HEALTH_TIMEOUT_MS = 10_000;

async function ping(model: string) {
  const anthropic = getClient();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    await anthropic.messages.create(
      {
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      },
      { signal: controller.signal },
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  // Secret gate: the caller must present HEALTHCHECK_SECRET via the
  // x-healthcheck-secret header OR a ?key= query param (for uptime monitors
  // that can't send custom headers), constant-time compared. Closed by default
  // — if the env var is unset, the endpoint stays locked rather than open.
  const secret = process.env.HEALTHCHECK_SECRET;
  const provided =
    req.headers.get("x-healthcheck-secret") ??
    new URL(req.url).searchParams.get("key");
  if (!secret || !secretMatches(provided, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await ping(PRIMARY_MODEL);
    return NextResponse.json({ status: "ok", model: PRIMARY_MODEL });
  } catch (primaryErr) {
    const primaryMsg =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn(
      "/api/health primary model %s failed: %s",
      PRIMARY_MODEL,
      primaryMsg,
    );

    // Mirror the chat route's fallback: if the backup model can still serve,
    // chat is degraded but not down — report ok with a `degraded` flag so the
    // HTTP status (200) reflects real serving capacity. Both down => fail.
    if (FALLBACK_MODEL !== PRIMARY_MODEL) {
      try {
        await ping(FALLBACK_MODEL);
        return NextResponse.json({
          status: "ok",
          degraded: true,
          model: FALLBACK_MODEL,
          primaryError: primaryMsg,
        });
      } catch (fallbackErr) {
        const fallbackMsg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : String(fallbackErr);
        console.error(
          "/api/health fallback model %s also failed: %s",
          FALLBACK_MODEL,
          fallbackMsg,
        );
        return NextResponse.json(
          { status: "fail", primaryError: primaryMsg, fallbackError: fallbackMsg },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { status: "fail", error: primaryMsg },
      { status: 503 },
    );
  }
}
