import { NextRequest, NextResponse } from "next/server";
import { issueAnonToken, ANON_MSG_BUDGET } from "@/lib/anon-token";
import { checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Issues a short-lived anonymous chat token for the try-Myla flow. Called only
// after the visitor accepts the AI-consent screen — the token encodes that
// consent. Per-IP daily issuance cap bounds abuse: cost ceiling per IP is
// roughly (issuance cap × message budget). The token itself carries the
// per-message budget enforced in /api/chat.
const ANON_ISSUE_DAILY_LIMIT = 20; // tokens per IP per day (tunable)

function clientIp(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

type Body = { consent?: boolean };

export async function POST(req: NextRequest) {
  if (!process.env.ANON_CHAT_SECRET) {
    console.error("/api/anon/start: ANON_CHAT_SECRET is not configured");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  // Consent is required for the anonymous path too — "non-gated" means no
  // account, not no consent. The token only issues once consent is asserted.
  if (body?.consent !== true) {
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }

  const rl = await checkRateLimit(
    `anon-issue:${clientIp(req)}`,
    ANON_ISSUE_DAILY_LIMIT,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "too many tries from this network — try again later." },
      { status: 429 },
    );
  }

  const issued = issueAnonToken(Math.floor(Date.now() / 1000));
  if (!issued) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  return NextResponse.json({
    token: issued.token,
    budget: ANON_MSG_BUDGET,
    expiresAt: issued.payload.exp * 1000,
  });
}
