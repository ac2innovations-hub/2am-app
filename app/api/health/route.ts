import { NextResponse } from "next/server";
import { getClient, PRIMARY_MODEL, FALLBACK_MODEL } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET() {
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
